const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const customer = require("../models/customer");
const router = require("express").Router();
const OtpVault = require("../models/otpVault");
const serviceProvider = require("../models/serviceProvider");

//get user details
router.post("/updateProfile", async (req, res) => {
  try {
    const type = req?.body.type;
    if (type == "customer") {
      await customer.findByIdAndUpdate(req.body.user._id, req.body.user);
      res
        .status(202)
        .json({ success: true, message: "User updates successfully" });
    } else if (type == "serviceProvider") {
      await serviceProvider.findByIdAndUpdate(req.body.user._id, req.body.user);
      res
        .status(202)
        .json({ success: true, message: "User updates successfully" });
    }
    res
      .status(404)
      .json({ success: false, message: `${type} category not found` });
  } catch (err) {
    res.status(500).json({ success: false, message: "User not found." });
  }
});

module.exports = router;
