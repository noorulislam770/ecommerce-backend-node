const express = require("express");
const {
  authenticateJWT,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const router = express.Router();

router.get(
  "/dashboard",
  authenticateJWT,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("admin/dashboard", { user: req.user });
  }
);

module.exports = router;
