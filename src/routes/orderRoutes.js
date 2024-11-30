const express = require("express");
const pool = require("../config/db");
const router = express.Router();

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
