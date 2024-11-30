const express = require("express");
const dotenv = require("dotenv");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const productRoutes = require("./src/routes/productRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
dotenv.config();

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.render("index");
});

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// products routes for testing using form input

app.get("/products", async (req, res) => {
  try {
    const [products] = await pool.query("SELECT * FROM products");
    res.render("products/index", { products });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

// Render add product form
app.get("/products/add", (req, res) => {
  res.render("products/add");
});

app.get("/products/:id", async (req, res) => {
  try {
    const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    } else {
      console.log(product);
      res.render("products/product", { product: product[0] });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
  // product =  await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
});

// Handle adding a new product
app.post("/products/add", async (req, res) => {
  const { name, description, price, category, tags } = req.body;
  console.log(name, description, price, category, tags);
  try {
    await pool.query(
      "INSERT INTO products (name, description, price, category, tags) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, category, tags]
    );
    res.redirect("/products");
  } catch (error) {
    res.status(500).json({ message: "Error adding product", error });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port http://127.0.0.1:${PORT}`);
});
