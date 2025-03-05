
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Database Model
const Payment = mongoose.model("Payment", new mongoose.Schema({ amount: Number }));

// ✅ API: Get Total Balance
app.get("/balance", async (req, res) => {
    try {
        let payments = await Payment.find();
        let total = payments.reduce((sum, p) => sum + p.amount, 0);
        res.json({ balance: total });
    } catch (err) {
        console.error("Error fetching balance:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Razorpay Webhook (Handle Payments)
app.post("/webhook", async (req, res) => {
    const { event, payload } = req.body;
    if (event === "payment.captured" && payload.payment.entity.amount === 100) {
        await Payment.create({ amount: 1 });
        console.log("✅ Payment Recorded: ₹1");
    }
    res.status(200).json({ success: true });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
