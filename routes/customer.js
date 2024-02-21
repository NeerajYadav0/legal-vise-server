const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const customer = require("../models/customer");
const router = require("express").Router();
const OtpVault = require("../models/otpVault");

router.post("/register", async (req, res) => {
  console.log("123");
  const salt = await bcrypt.genSalt();

  const cust = new customer({
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(req.body?.password, salt),
    state: req.body.state,
    city: req.body.city,
    phoneNumber: req.body.phoneNumber,
    aadharNumber: req.body.aadharNumber,
    otp: req.body.otp,
  });

  try {
    let otpData = await OtpVault.findOne({ mobileNo: req.body.phoneNumber });
    console.log(otpData);
    if (otpData) {
      if (req.body.otp == otpData.otp) {
        await OtpVault.findOneAndDelete({ mobileNo: req.body.phoneNumber });
        const user = await cust.save();
        res.status(201).json({
          success: true,
          message: "OTP verification successful!",
          user: user,
        });
      } else {
        res.status(400).json({ success: false, message: "Invalid OTP." });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Mobile number not found or OTP expired.",
      });
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    var user = await customer.findOne({ email: req.body.email });
    if (!user) {
      !user && res.status(401).json("Wrong Credentials");
    } else {
      var userEmail = user.email;
      var isMatch = await bcrypt.compare(req.body?.password, user.password);
      if (!isMatch) return res.status(400).json("Invalid id or pass");
      var type = user.type;
      var token = jwt.sign({ userEmail, type }, process.env.JWT_SECRET);
      delete user.password;
      res.status(200).json({ token, user, type });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//get user details
router.post("/getDetails", async (req, res) => {
  try {
    var user = await customer.findOne({ email: req.body.email });
    if (!user) {
      !user && res.status(401).json("Wrong Credentials");
    } else {
      res
        .status(200)
        .json({ success: true, message: "User details given.", user: user });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "User not found." });
  }
});

module.exports = router;
