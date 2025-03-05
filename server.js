
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// ✅ Create a Balance Schema
const balanceSchema = new mongoose.Schema({ balance: { type: Number, default: 0 } });
const BalanceModel = mongoose.model("Balance", balanceSchema);

// ✅ Fetch balance API
app.get("/balance", async (req, res) => {
    const balanceDoc = await BalanceModel.findOne({});
    res.json({ balance: balanceDoc ? balanceDoc.balance : 0 });
});

// ✅ Razorpay Webhook (Update Balance)
app.post("/razorpay-webhook", express.json(), async (req, res) => {
    const payment = req.body;

    if (payment.event === "payment.captured") {
        const amount = payment.payload.payment.entity.amount / 100; // Convert from paise to ₹

        await BalanceModel.findOneAndUpdate({}, { $inc: { balance: amount } }, { upsert: true });
        console.log("✅ Payment received: ₹", amount);
    }

    res.status(200).send("Webhook received");
});

// ✅ Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
