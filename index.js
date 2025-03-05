require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!MONGO_URI) {
    console.error("❌ MongoDB connection string is missing!");
    process.exit(1);
}

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Define Mongoose Schema and Model
const balanceSchema = new mongoose.Schema({
    amount: { type: Number, default: 0 }
});
const Balance = mongoose.model('hanu', balanceSchema);

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ API to Get Balance
app.get('/balance', async (req, res) => {
    try {
        const balanceDoc = await Balance.findOne();
        res.json({ balance: balanceDoc ? balanceDoc.amount : 0 });
    } catch (err) {
        res.status(500).json({ error: "Error fetching balance" });
    }
});

// ✅ Razorpay Webhook Endpoint
app.post('/webhook', async (req, res) => {
    const secret = RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const shasum = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');

    if (shasum !== signature) {
        return res.status(400).json({ error: "Invalid signature" });
    }

    if (req.body.event === "payment.captured") {
        try {
            let balanceDoc = await Balance.findOne();
            if (!balanceDoc) {
                balanceDoc = new Balance({ amount: 0 });
            }
            balanceDoc.amount += 1; // ✅ Increase balance by 1 Rupee
            await balanceDoc.save();
            console.log("✅ Balance Updated:", balanceDoc.amount);
        } catch (err) {
            console.error("❌ Error updating balance:", err);
        }
    }
    res.json({ status: "ok" });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
