const crypto = require("crypto");

const generateHash = (orderId, amount, currency = "LKR") => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
  const secret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  const secretHash = crypto
    .createHash("md5")
    .update(secret)
    .digest("hex")
    .toUpperCase();

  const hashInput = merchantId + orderId + parseFloat(amount).toFixed(2) + currency + secretHash;

  console.log("=== HASH DEBUG ===");
  console.log("Merchant ID:", merchantId);
  console.log("Order ID:", orderId);
  console.log("Amount:", parseFloat(amount).toFixed(2));
  console.log("Currency:", currency);
  console.log("Secret:", secret);
  console.log("Secret Hash:", secretHash);
  console.log("Hash Input:", hashInput);

  const hash = crypto.createHash("md5").update(hashInput).digest("hex").toUpperCase();
  console.log("Final Hash:", hash);
  console.log("=================");

  return hash;
};

const verifyWebhookHash = (body) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;

  const secret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  const secretHash = crypto
    .createHash("md5")
    .update(secret)
    .digest("hex")
    .toUpperCase();

  const localHash = crypto
    .createHash("md5")
    .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash)
    .digest("hex")
    .toUpperCase();

  return localHash === md5sig;
};

module.exports = { generateHash, verifyWebhookHash };