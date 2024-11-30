const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Add a product to the cart
router.post("/add/:productId", async (req, res) => {
  const { productId } = req.params;
  const { userId, quantity } = req.body;

  try {
    // Check if cart exists for the user, if not, create one
    const [cart] = await pool.query("SELECT * FROM carts WHERE user_id = ?", [
      userId,
    ]);
    let cartId;

    if (cart.length === 0) {
      const result = await pool.query(
        "INSERT INTO carts (user_id) VALUES (?)",
        [userId]
      );
      cartId = result[0].insertId;
    } else {
      cartId = cart[0].id;
    }

    // Add item to cart
    await pool.query(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
      [cartId, productId, quantity, quantity]
    );

    res.status(201).json({ message: "Product added to cart successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart", error });
  }
});

// Update quantity of a product in the cart
router.put("/update/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  try {
    await pool.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [
      quantity,
      itemId,
    ]);
    res.status(200).json({ message: "Cart item updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating cart item", error });
  }
});

// Remove an item from the cart
router.delete("/remove/:itemId", async (req, res) => {
  const { itemId } = req.params;
  try {
    await pool.query("DELETE FROM cart_items WHERE id = ?", [itemId]);
    res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error removing cart item", error });
  }
});

module.exports = router;
