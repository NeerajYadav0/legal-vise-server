const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const serviceProvider = require("../models/serviceProvider");
const router = require("express").Router();
const job = require("../models/jobs");
const OtpVault = require("../models/otpVault");
const Jobs = require("../models/jobs");

router.post("/register", async (req, res) => {
  const salt = await bcrypt.genSalt();
  const provider = new serviceProvider({
    name: req.body?.name,
    email: req.body?.email,
    password: await bcrypt.hash(req.body?.password, salt),
    state: req.body?.state,
    city: req.body.city,
    phoneNumber: req.body.phoneNumber,
    aadharNumber: req.body.aadharNumber,
    tenthMarksheet: req.body.tenthMarksheet,
    twelthMarksheet: req.body.twelthMarksheet,
    graduationMarksheet: req.body.graduationMarksheet,
    category: req.body.category,
  });

  try {
    let otpData = await OtpVault.findOne({ mobileNo: req.body.phoneNumber });
    if (otpData) {
      if (req.body.otp == otpData.otp) {
        await OtpVault.findOneAndDelete({ mobileNo: req.body.phoneNumber });
        const user = await provider.save();
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
    var user = await serviceProvider.findOne({ email: req.body.email });
    if (!user) {
      !user && res.status(401).json("Wrong Credentials");
    } else {
      var userEmail = user.email;
      var isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Invalid id or pass", success: false });
      var type = user.type;
      var token = jwt.sign({ userEmail, type }, process.env.JWT_SECRET);
      delete user.password;
      res.status(200).json({ token, user, type, success: true });
    }
  } catch (err) {
    res.status(500).json({ err, success: false });
  }
});

//UPDATE
// router.put("/update/:id", async (req, res) => {
//   console.log('====================================');
//   console.log(req.params.id);
//   console.log('====================================');
//     try {
//       const updatedProfile = await serviceProvider.findByIdAndUpdate(
//         req.params.id,
//         {
//           $set: req.body,
//         },
//         { new: true }
//       );

//       res.status(200).json(updatedProfile);
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   });

// get all service provider jobs
router.get("/getAllServiceProviderJobs/:id", async (req, res) => {
  try {
    const sp = await serviceProvider.findById(req.params.id);
    const ids = sp.jobs;

    const records = await job.find({ _id: { $in: ids } });
    res.status(200).send(records);
  } catch (error) {
    res.status(500).json(err);
  }
});

//get user details
router.post("/getDetails", async (req, res) => {
  try {
    var user = await serviceProvider.findOne({ email: req.body.email });
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

// add job to wishlist
router.post("/addToWishlist", async (req, res) => {
  try {
    const jobId = req.body.jobId;
    const serviceProviderId = req.body.serviceProviderId;

    const result = await serviceProvider.findByIdAndUpdate(serviceProviderId, {
      $addToSet: { wishlist: jobId },
    });
    res.status(200).json({ success: true, message: "Added to Wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// remove from wishlist
router.delete("/removeFromWishlist", async (req, res) => {
  try {
    const jobId = req.body.id;
    const serviceProviderId = req.body.serviceProviderId;

    const user = await serviceProvider.findById(serviceProviderId);
    let wishlist = user?.wishlist;
    wishlist = wishlist.filter((item) => {
      console.log(typeof item);
      console.log(typeof jobId);
      return item !== jobId;
    });
    console.log(wishlist);
    const result = await serviceProvider.findByIdAndUpdate(serviceProviderId, {
      // $pull: { wishlist: jobId },
      // $set: {
      //   wishlist: serviceProvider.wishlist.filter((item) => item !== jobId),
      // },
      $set: { wishlist: wishlist },
    });
    res.status(200).json({
      success: true,
      message: "Removed from Wishlist",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// get wishlist
router.get("/getWishlistJobs/:id", async (req, res) => {
  try {
    const user = await serviceProvider.findById(req.params.id);
    if (user) {
      const wishlistJobs = await Jobs.find({ _id: { $in: user.wishlist } });
      // console.log(wishlistJobs);
      res.status(200).json({ success: true, wishlistJobs });
    } else {
      res.status(500).json({ success: false, message: "user not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// search users by names
router.post("/getSimilarServiceProviders", async (req, res) => {
  try {
    const namePattern = new RegExp(req.body.name, "i"); // Case-insensitive regex pattern
    const similarUsers = await serviceProvider.find({ name: namePattern });

    if (similarUsers.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "No similar users found." });
    } else {
      res.status(200).json({
        success: true,
        message: "Similar users found.",
        users: similarUsers,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error finding similar users." });
  }
});

router.get("/getDetails/:id", async (req, res) => {
  try {
    var user = await serviceProvider.findById(req.params.id);
    if (!user) {
      !user && res.status(401).json("User not found");
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
