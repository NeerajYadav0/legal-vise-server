const router = require("express").Router();
const OtpVault = require("../models/otpVault");
const axios = require("axios");

router.post("/send-otp", async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber;

    let otpInfo = await OtpVault.findOne({ mobileNo: mobileNumber });
    if (otpInfo) {
      res.json({ success: false, message: `OTP already sent` });
    } else {
      const otp = Math.floor(100000 + Math.random() * 900000);
      console.log("====================================");
      console.log(mobileNumber);
      console.log(otp);
      console.log(process.env.FAST2SMS_API_KEY);
      console.log("====================================");
      const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
        params: {
          authorization: process.env.FAST2SMS_API_KEY,
          variables_values: otp,
          route: "otp",
          numbers: mobileNumber,
          // variables_values :"",
          flash: "0",
        },
      });

      const otpData = new OtpVault({
        mobileNo: mobileNumber,
        otp: otp,
      });
      await otpData.save();
      res.json({ success: true, message: `OTP sent successfully! ${otp} ` });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { mobileNumber, otp } = req.body;

  let otpData = await OtpVault.findOne({ mobileNo: mobileNumber });
  console.log("====================================");
  console.log(otpData);
  console.log("====================================");
  if (otpData) {
    if (otp == otpData.otp) {
      await OtpVault.findOneAndDelete({ mobileNo: mobileNumber });
      res.json({ success: true, message: "OTP verification successful!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP." });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Mobile number not found or OTP expired.",
    });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber;

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("====================================");
    console.log(mobileNumber);
    console.log(otp);
    console.log(process.env.FAST2SMS_API_KEY);
    console.log("====================================");
    //   const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
    //     params: {
    //       authorization: process.env.FAST2SMS_API_KEY,
    //       variables_values: `Your OTP is ${otp}`,
    //       route: 'otp',
    //       numbers: mobileNumber,
    //       variables_values :"",
    //       flash : "0"

    //     }
    //   });
    const options = {
      upsert: true, // If the document does not exist, insert it
      new: true, // Return the updated document
      runValidators: true, // Run Mongoose validation on the update operation
    };

    await OtpVault.findOneAndUpdate(
      { mobileNo: mobileNumber },
      { mobileNo: mobileNumber, otp: otp, expirationDate: Date.now() },
      options
    );

    res.json({ success: true, message: `OTP sent successfully! ${otp} ` });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
});

module.exports = router;
