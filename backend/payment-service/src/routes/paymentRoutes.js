const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  payhereWebhook,
  confirmPayment,
  getMyPayments,
  getPaymentStatus,
  getAllPayments,
  getPaymentStats,
} = require("../controllers/paymentController");
const { protect, restrictTo } = require("../middleware/auth");

// Public - PayHere webhook
router.post("/webhook", payhereWebhook);

// Admin routes MUST be before /:orderId
router.get("/admin/stats", protect, restrictTo("admin"), getPaymentStats);
router.get("/admin/all",   protect, restrictTo("admin"), getAllPayments);

// Patient routes
router.post("/initiate", protect, restrictTo("patient"), initiatePayment);
router.post("/confirm",  protect, restrictTo("patient"), confirmPayment);
router.get("/my",        protect, restrictTo("patient"), getMyPayments);

// Dynamic param LAST
router.get("/:orderId", protect, getPaymentStatus);

module.exports = router;