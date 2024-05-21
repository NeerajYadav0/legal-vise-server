const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const customer = require("../models/customer");
const router = require("express").Router();
const OtpVault = require("../models/otpVault");
const serviceProvider = require("../models/serviceProvider");
// const jwt = require("jsonwebtoken");

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
//verify jwt token
// router.post("/verifyToken", async (req, res) => {
//   try {
//     let token = req.headers["authorization"]?.split(" ")[1];

//     if (!token) return res.status(403).json("access denied");

//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified;
//     res.status(200).json({ success: true, message: "token verified" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Invalid Token." });
//   }
// });

module.exports = router;
