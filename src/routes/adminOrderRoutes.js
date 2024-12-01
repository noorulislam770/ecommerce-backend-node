const express = require("express");
const pool = require("../config/db");
const {
  authenticateJWT,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// List all orders
router.get("/", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, CONCAT(u.username, ' (', u.email, ')') AS customer, 
              SUM(oi.quantity * p.price) AS total, o.status, o.created_at
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON o.user_id = u.id
       GROUP BY o.id`
    );
    res.render("admin/orders/index", { orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// View details of a specific order
router.get(
  "/view/:orderId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    const { orderId } = req.params;
    try {
      const [orderDetails] = await pool.query(
        `SELECT p.name AS product_name, oi.quantity, p.price, (oi.quantity * p.price) AS subtotal
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
        [orderId]
      );

      const [order] = await pool.query(
        `SELECT o.id, CONCAT(u.username, ' (', u.email, ')') AS customer, o.status, o.created_at
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.render("admin/orders/view", { order: order[0], orderDetails });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order details", error });
    }
  }
);

// Update order status
router.post(
  "/update/:orderId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
        status,
        orderId,
      ]);
      res.redirect("/admin/orders");
    } catch (error) {
      res.status(500).json({ message: "Error updating order status", error });
    }
  }
);

// Delete an order
router.post(
  "/delete/:orderId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    const { orderId } = req.params;

    try {
      await pool.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
      await pool.query("DELETE FROM orders WHERE id = ?", [orderId]);
      res.redirect("/admin/orders");
    } catch (error) {
      res.status(500).json({ message: "Error deleting order", error });
    }
  }
);

module.exports = router;
