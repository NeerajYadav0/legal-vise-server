const dotenv = require("dotenv");
dotenv.config();
const router = require("express").Router();
const Razorpay = require("razorpay");
// const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
// console.log(process.env.RAZORPAY_ID_KEY);
// console.log(process.env.MONGOURL);

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

router.post("/create_order", async (req, res) => {
  try {
    const amount = req.body.amount * 100;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "neerajyadav4001@gmail.com",
    };

    const paymentRespose = await razorpayInstance.orders.create(options);
    res.status(200).json({ success: true, paymentRespose: paymentRespose });
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
