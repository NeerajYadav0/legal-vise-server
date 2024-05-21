const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const customer = require("../models/customer");
const router = require("express").Router();
const OtpVault = require("../models/otpVault");
const serviceProvider = require("../models/serviceProvider");
const verifyToken = require("../middleware/auth");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dtr3t5cde",
  api_key: "716364482187956",
  api_secret: "C_-nlN731fySJcnvtoQio6o3v5g",
});
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

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

router.post("/change_password", async (req, res) => {
  const salt = await bcrypt.genSalt();
  const currentPassword = req.body.currentPassword;
  const newPassword = await bcrypt.hash(req.body?.newPassword, salt);
  const id = req.body?.userId;
  const user = await serviceProvider.findById(id);

  try {
    var isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log(isMatch);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid id or pass", success: false });
    } else {
      await serviceProvider
        .findByIdAndUpdate(id, { password: newPassword })
        .then((data) => {
          res
            .status(200)
            .json({ success: true, message: "password updated successfully" });
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
router.post("/getDetails", verifyToken, async (req, res) => {
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
    const temp = await serviceProvider.findByIdAndUpdate(serviceProviderId, {
      $inc: { unlock_count: 1 },
    });
    console.log(temp);
    res.status(200).json({ success: true, message: "Added to Unlocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// UPDATE
// router.put("/update/:id", async (req, res) => {
//   // console.log('====================================');
//   // console.log(req.params.id);
//   // console.log('====================================');
//     try {
//       const updatedProfile = await customer.findByIdAndUpdate(
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

// new update
// router.put("/update/:id", async (req, res) => {
//   try {
//     const existingProfile = await customer.findById(req.params.id);

//     if (!existingProfile) {
//       return res.status(404).json({ error: "Profile not found" });
//     }

//     // Iterate over each key in the request body
//     Object.keys(req.body).forEach((key) => {
//       // If the key exists in the existing profile, update its value
//       if (existingProfile[key] !== undefined) {
//         existingProfile[key] = req.body[key];
//       }
//     });

//     // Save the updated profile
//     // console.log(existingProfile);
//     const updatedProfile = await existingProfile.save();

//     res.status(200).json({ success: true, updatedProfile: updatedProfile });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// new update
router.put("/update/:id", upload.single("profilePicture"), async (req, res) => {
  try {
    const existingProfile = await customer.findById(req.params.id);

    if (!existingProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Handle profilePicture
    if (req.file) {
      const file = req.file;
      const base64String = file.buffer.toString("base64");

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64String}`,
        {
          folder: "your_folder_name", // Optional folder in Cloudinary
          use_filename: true,
        }
      );
      console.log(result.secure_url);

      existingProfile.profilePicture = result.secure_url;
      console.log(existingProfile);
    }

    // Iterate over each key in the request body
    Object.keys(req.body).forEach((key) => {
      // If the key exists in the existing profile, update its value
      if (existingProfile[key] !== undefined && key !== "profilePicture") {
        existingProfile[key] = req.body[key];
      }
    });

    // Save the updated profile
    const updatedProfile = await existingProfile.save();

    res.status(200).json({ success: true, updatedProfile: updatedProfile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// add legalist to fav
router.post("/add_to_fav/", async (req, res) => {
  try {
    const clientId = req.body.clientId;
    const legalistId = req.body.legalistId;

    const updatedData = await customer
      .updateOne(
        { _id: clientId, favServiceProvider: { $ne: legalistId } },
        { $push: { favServiceProvider: legalistId } }
      )
      .then((result) => {
        if (result.modifiedCount > 0) {
          console.log("legalistId added successfully.");
        } else {
          console.log("legalistId already exists or customer not found.");
        }
      });

    res.status(200).json({ success: true, updatedData: updatedData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// remove legalist from fav
router.post("/remove_from_fav/", async (req, res) => {
  try {
    const clientId = req.body.clientId;
    const legalistId = req.body.legalistId;

    const updatedData = await customer
      .updateOne(
        { _id: clientId, favServiceProvider: legalistId },
        { $pull: { favServiceProvider: legalistId } }
      )
      .then((result) => {
        if (result.modifiedCount > 0) {
          console.log("legalistId removed successfully.");
        } else {
          console.log("legalistId dosent exist or customer not found.");
        }
      });

    res.status(200).json({ success: true, updatedData: updatedData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// get fav legalist
router.get("/get_fav_legalist/:id", async (req, res) => {
  const clientId = req.params.id;

  try {
    customer
      .findOne(
        { _id: clientId }, // Condition to find the document by clientId
        { favServiceProvider: 1, _id: 0 } // Projection to return only favServiceProvider field
      )
      .then((customerData) => {
        if (customerData) {
          res.status(200).json({
            success: true,
            favServiceProvider: customerData.favServiceProvider,
          });
        } else {
          res
            .status(200)
            .json({ success: false, error: "Customer not found." });
          console.log("Customer not found.");
        }
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
