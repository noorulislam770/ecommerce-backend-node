const express = require("express");
const pool = require("../config/db");
const {
  authenticateJWT,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const router = express.Router();

router.get(
  "/dashboard",
  authenticateJWT,
  authorizeRoles("admin"),

  async (req, res) => {
    try {
      const [products] = await pool.query("SELECT * FROM products");
      const [orders] = await pool.query(
        `SELECT o.id, CONCAT(u.username, ' (', u.email, ')') AS customer, 
              SUM(oi.quantity * p.price) AS total, o.status
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON o.user_id = u.id
       GROUP BY o.id`
      );
      res.render("admin/dashboard", { products, orders });
    } catch (error) {
      res.status(500).json({ message: "Error loading dashboard", error });
    }
  }
);

module.exports = router;
