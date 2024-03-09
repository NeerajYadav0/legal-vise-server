const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const customer = require("../models/customer");
const router = require("express").Router();
const OtpVault = require("../models/otpVault");
const serviceProvider = require("../models/serviceProvider");

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
//get user details by id
router.get("/getDetails/:id", async (req, res) => {
  try {
    var user = await customer.findById(req.params.id);
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

// search users by names
router.post("/getSimilarUsers", async (req, res) => {
  try {
    const namePattern = new RegExp(req.body.name, "i"); // Case-insensitive regex pattern
    const similarUsers = await customer.find({ name: namePattern });

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

// get unlocked users
router.get("/get_unlocked/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await customer.findById(id).then((data) => {
      res.status(200).json({ success: true, unlockedUsers: data.unlocked });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// get details of Interested users
router.post("/getInterestedDetails", async (req, res) => {
  try {
    // const interested = req.body.interested;
    // let name = "";
    // const result = await interested.map(async (data) => {
    //   await serviceProvider.findById(data.serviceProviderId).then((res) => {
    //     name = res?.name;
    //   });
    //   return  { name: name };
    // });
    // await result;
    // console.log(result);
    // res.json(result);

    const interested = req.body.interested;
    const unlocked = req.body.unlocked;
    let name = "";
    const result = await Promise.all(
      interested.map(async (data) => {
        const res = await serviceProvider.findById(data.serviceProviderId);
        name = res?.name;
        return {
          id: res._id,
          name: res.name,
          comments: data.comments,
          approxAmount: data.approxAmount,
          unlocked: unlocked.indexOf(data.serviceProviderId) !== -1,
        };
      })
    );
    console.log(result);
    res.json(result);

    // if (similarUsers.length === 0) {
    //   res
    //     .status(404)
    //     .json({ success: false, message: "No similar users found." });
    // } else {
    //   res.status(200).json({
    //     success: true,
    //     message: "Similar users found.",
    //     users: similarUsers,
    //   });
    // }
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
});

// add user in unlocked
router.post("/add_unlocked", async (req, res) => {
  try {
    const clientId = req.body.clientId;
    const serviceProviderId = req.body.serviceProviderId;

    const result = await customer.findByIdAndUpdate(clientId, {
      $addToSet: { unlocked: serviceProviderId },
    });
    res.status(200).json({ success: true, message: "Added to Unlocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

module.exports = router;
