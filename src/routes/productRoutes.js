const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// View all products

router.get("/", async (req, res) => {
  try {
    const [products] = await pool.query("SELECT * FROM products");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

// View a single product by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product[0]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
});

// Add a new product
router.post("/add", async (req, res) => {
  const { name, description, price, category, tags } = req.body;
  try {
    await pool.query(
      "INSERT INTO products (name, description, price, category, tags) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, category, tags]
    );
    res.status(201).json({ message: "Product added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding product", error });
  }
});

// Update an existing product
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, tags } = req.body;
  try {
    const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    await pool.query(
      "UPDATE products SET name = ?, description = ?, price = ?, category = ?, tags = ? WHERE id = ?",
      [name, description, price, category, tags, id]
    );
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
});

// Delete a product
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
});

module.exports = router;
