const express = require("express");
const dotenv = require("dotenv");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const productRoutes = require("./src/routes/productRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const adminOrderRoutes = require("./src/routes/adminOrderRoutes");

const cookieParser = require("cookie-parser");
const attachUserToViews = require("./src/middleware/userMiddleware");
const {
  authenticateJWT,
  authorizeRoles,
} = require("./src/middleware/authMiddleware");
dotenv.config();

const app = express();

app.use(cookieParser());
app.use(attachUserToViews);
app.use(authenticateJWT);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  user = req.user;
  res.render("index", { user: user });
});

app.get("/auth/logout", authenticateJWT, (req, res) => {
  // Clear the JWT token from the cookies
  res.clearCookie("token"); // If using cookies to store the token
  res.redirect("/login"); // Redirect to homepage or login page
});

app.get(
  "/orders",
  authenticateJWT,
  authorizeRoles("customer"),
  async (req, res) => {
    const userId = req.user.id; // Replace with req.user.id when authentication is added
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
      res.render("orders/index", { orders: orders || [], user: req.user });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  }
);

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get(
  "/admin/orders",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
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

      console.log(orders[1]);
      if (orders.length === 0) {
        return res.status(404).json({ message: "No pending orders" });
      }
      console.log(orders);
      res.render("admin/orders", {
        orders: orders || [],
        user: req.user,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  }
);

app.get(
  "/admin/orders/:orderId",
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
      console.log(orderDetails);
      res.render("admin/orders/order", { order: order[0], orderDetails });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order details", error });
    }
  }
);

app.post(
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
app.post(
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

// products routes for testing using form input

app.get("/products", async (req, res) => {
  user = req.user;
  console.log(user);
  try {
    const [products] = await pool.query("SELECT * FROM products");

    res.render("products/index", { products, user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error, user });
  }
});

app.get("/cart", authenticateJWT, async (req, res) => {
  const userId = req.user.id; // Replace with req.user.id when authentication is added
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

// Render add product form
app.get(
  "/products/add",
  authenticateJWT,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("products/add");
  }
);

app.get(
  "/products/edit/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const [product] = await pool.query(
        "SELECT * FROM products WHERE id = ?",
        [req.params.id]
      );
      if (product.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      } else {
        res.render("products/edit", { product: product[0] });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error });
    }
  }
);

app.get("/products/:id", async (req, res) => {
  const user = req.user;
  try {
    const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    } else {
      console.log(product);
      res.render("products/product", { product: product[0], user });
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
