const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/place", async (req, res) => {
  const userId = 1; // Replace with req.user.id when authentication is added
  try {
    const [cartItems] = await pool.query(
      `SELECT ci.product_id, ci.quantity 
       FROM cart_items ci 
       WHERE ci.cart_id = (SELECT id FROM carts WHERE user_id = ?)`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.redirect("/cart");
    }

    // Create a new order
    const [result] = await pool.query(
      "INSERT INTO orders (user_id, status) VALUES (?, 'pending')",
      [userId]
    );
    const orderId = result.insertId;

    // Add cart items to order
    for (const item of cartItems) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [orderId, item.product_id, item.quantity]
      );
    }

    // Clear the cart
    await pool.query(
      "DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = ?)",
      [userId]
    );

    res.redirect("/orders");
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error });
  }
});

router.get("/", async (req, res) => {
  const userId = 1; // Replace with req.user.id when authentication is added
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.created_at, 
       SUM(oi.quantity * p.price) AS total 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       JOIN products p ON oi.product_id = p.id 
       WHERE o.user_id = ? 
       GROUP BY o.id`,
      [userId]
    );
    res.render("orders/index", { orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// Place an order
router.post("/", async (req, res) => {
  const { userId } = req.body;

  try {
    // Create a new order with a "pending" status
    const result = await pool.query(
      "INSERT INTO orders (user_id, status) VALUES (?, 'pending')",
      [userId]
    );
    const orderId = result[0].insertId;

    // Add cart items to the order
    const [cartItems] = await pool.query(
      "SELECT * FROM cart_items WHERE cart_id = ?",
      [userId]
    );
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "No items in the cart" });
    }

    for (let item of cartItems) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [orderId, item.product_id, item.quantity]
      );
    }

    // Clear the cart after order is placed
    await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [userId]);

    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error });
  }
});

// View all orders for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ?",
      [userId]
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// View an order by ID
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const [order] = await pool.query("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);
    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order[0]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error });
  }
});

module.exports = router;
