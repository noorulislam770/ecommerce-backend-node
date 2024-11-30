const express = require("express");
const pool = require("../config/db");
const {
  authenticateJWT,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", authenticateJWT, async (req, res) => {
  // Replace with req.user.id when authentication is added
  const userId = req.user.id;
  console.log(req.user.id);
  try {
    const [cartItems] = await pool.query(
      `SELECT ci.id, p.name AS product_name, p.price, ci.quantity 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.cart_id = (SELECT id FROM carts WHERE user_id = ?)`,
      [userId]
    );
    res.render("cart/index", { cartItems, user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart items", error });
  }
});

// Add a product to the cart
router.post(
  "/add/:productId",
  authenticateJWT,
  authorizeRoles("customer"),
  async (req, res) => {
    const { productId } = req.params;
    let { quantity } = req.body;
    const userId = req.user.id;

    console.log("pID = ", productId, "UID = ", userId, "QTY = ", quantity);
    console.log(req.user.username);
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
  }
);

// Update quantity of a product in the cart
router.post("/update/:itemId", async (req, res) => {
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
router.post("/remove/:itemId", authenticateJWT, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;
  try {
    const cartItem = await pool.query(
      "SELECT ci.id FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE ci.id = ? AND c.user_id = ?",
      [itemId, userId]
    );

    if (cartItem.length === 0) {
      return res
        .status(404)
        .json({ message: "Cart item not found or unauthorized" });
    } else {
      // Actual deletion from cart
      await pool.query("DELETE FROM cart_items WHERE id = ?", [itemId]);
      return res
        .status(200)
        .json({ message: "Cart item removed successfully" });
    }

    res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error removing cart item", error });
  }
});

module.exports = router;
