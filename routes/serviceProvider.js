const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const serviceProvider = require("../models/serviceProvider");
const router = require("express").Router();
const job = require("../models/jobs");
const OtpVault = require("../models/otpVault");
const Jobs = require("../models/jobs");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dtr3t5cde",
  api_key: "716364482187956",
  api_secret: "C_-nlN731fySJcnvtoQio6o3v5g",
});
const storage = multer.memoryStorage();
const { verifyToken, verifyAdmin } = require("./../middleware/auth");

const upload = multer({ storage: storage });

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

// change password
router.post("/change_password", verifyToken, async (req, res) => {
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

// update
// router.put("/update/:id", async (req, res) => {
//   try {
//     const existingProfile = await serviceProvider.findById(req.params.id);

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

// router.put(
//   "/update/:id",
//   upload.fields([{ name: "pictures" }, { name: "profilePicture" }]),
//   async (req, res) => {
//     console.log(req.body);
//     try {
//       const existingProfile = await serviceProvider.findById(req.params.id);

//       if (!existingProfile) {
//         return res.status(404).json({ error: "Profile not found" });
//       }

//       // Handle pictures array
//       if (req.files && req.files.pictures) {
//         const pictures = [];

//         for (let i = 0; i < req.files.pictures.length; i++) {
//           const file = req.files.pictures[i];
//           const base64String = file.buffer.toString("base64");

//           const result = await cloudinary.uploader.upload(
//             `data:${file.mimetype};base64,${base64String}`,
//             {
//               folder: "your_folder_name", // Optional folder in Cloudinary
//               use_filename: true,
//             }
//           );

//           pictures.push(result.secure_url);
//         }

//         // If pictures are uploaded, assign them to existingProfile
//         existingProfile.pictures =
//           pictures.length > 0 ? pictures : existingProfile.pictures;
//       }

//       // Handle profilePicture
//       if (req.files && req.files.profilePicture) {
//         const file = req.files.profilePicture[0];
//         const base64String = file.buffer.toString("base64");

//         const result = await cloudinary.uploader.upload(
//           `data:${file.mimetype};base64,${base64String}`,
//           {
//             folder: "your_folder_name", // Optional folder in Cloudinary
//             use_filename: true,
//           }
//         );
//         console.log(result.secure_url);

//         existingProfile.profilePicture = result.secure_url;
//         console.log(existingProfile);
//       }

//       // Update other fields from request body
//       Object.keys(req.body).forEach((key) => {
//         if (
//           existingProfile[key] !== undefined &&
//           key != "profilePicture" &&
//           key != "pictures"
//         ) {
//           existingProfile[key] = req.body[key];
//         }
//       });
//       console.log(existingProfile);

//       // Save the updated profile
//       const updatedProfile = await existingProfile.save();

//       res.status(200).json({ success: true, updatedProfile: updatedProfile });
//     } catch (err) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   }
// );

// new update

router.put(
  "/update/:id",
  verifyToken,
  upload.fields([{ name: "pictures" }, { name: "profilePicture" }]),
  async (req, res) => {
    console.log(req.body);
    try {
      const existingProfile = await serviceProvider.findById(req.params.id);

      if (!existingProfile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Handle profilePicture
      if (req.files && req.files.profilePicture) {
        const file = req.files.profilePicture[0];
        const base64String = file.buffer.toString("base64");

        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${base64String}`,
          {
            folder: "your_folder_name", // Optional folder in Cloudinary
            use_filename: true,
          }
        );

        existingProfile.profilePicture = result.secure_url;
      }

      // Handle pictures array
      let picturesFromFrontend = req.body.pictures || [];

      // If pictures array is a string (single link), convert it to an array
      if (typeof picturesFromFrontend === "string") {
        picturesFromFrontend = [picturesFromFrontend];
      }

      if (req.files && req.files.pictures) {
        for (let i = 0; i < req.files.pictures.length; i++) {
          const file = req.files.pictures[i];
          const base64String = file.buffer.toString("base64");

          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${base64String}`,
            {
              folder: "your_folder_name", // Optional folder in Cloudinary
              use_filename: true,
            }
          );

          picturesFromFrontend.push(result.secure_url);
        }
      }

      // Compare and update pictures array
      existingProfile.pictures = picturesFromFrontend;

      // Update other fields from request body
      Object.keys(req.body).forEach((key) => {
        if (
          existingProfile[key] !== undefined &&
          key !== "profilePicture" &&
          key !== "pictures"
        ) {
          existingProfile[key] = req.body[key];
        }
      });

      // Save the updated profile
      const updatedProfile = await existingProfile.save();

      res.status(200).json({ success: true, updatedProfile: updatedProfile });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// get all service provider jobs
router.get("/getAllServiceProviderJobs/:id", verifyToken, async (req, res) => {
  try {
    console.log(req.params.id);
    const id = req.params.id;
    const sp = await serviceProvider.findById(id);
    console.log(sp);
    const ids = sp.jobs;
    // console.log(ids);
    const records = await job.find({ _id: { $in: ids } });
    res.status(200).send(records);
  } catch (error) {
    res.status(500).json(error);
  }
});
router.get("/getAllSelectedJobs/:id", verifyToken, async (req, res) => {
  try {
    console.log(req.params.id);
    const id = req.params.id;
    const sp = await serviceProvider.findById(id);
    console.log(sp);
    const ids = sp.selectedJobs;
    // console.log(ids);
    const records = await job.find({ _id: { $in: ids } });
    res.status(200).send(records);
  } catch (error) {
    res.status(500).json(error);
  }
});

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

// // Get all service provider jobs
// router.get("/getAllServiceProviderJobs/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check if id is a valid ObjectId
//     if (!ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid service provider ID" });
//     }

//     const sp = await serviceProvider.findById(id);

//     // Check if the service provider exists
//     if (!sp) {
//       return res.status(404).json({ message: "Service provider not found" });
//     }

//     const ids = sp.jobs;

//     // Fetch jobs using the array of job IDs
//     const records = await Jobs.find({ _id: { $in: ids } });

//     res.status(200).json(records);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

//get user details
router.post("/getDetails", verifyToken, async (req, res) => {
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
router.post("/addToWishlist", verifyToken, async (req, res) => {
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
router.delete("/removeFromWishlist", verifyToken, async (req, res) => {
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
router.get("/getWishlistJobs/:id", verifyToken, async (req, res) => {
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
router.post("/getSimilarServiceProviders", verifyToken, async (req, res) => {
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

router.get("/getDetails/:id", verifyToken, async (req, res) => {
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

// save rating
// router.post("/add_rating", async (req, res) => {
//   try {
//     const { comment, rating, serviceProviderId, customerId } = req.body;
//     console.log("enter 0");
//     // Validate serviceProviderId and customerId
//     if (
//       !mongoose.Types.ObjectId.isValid(serviceProviderId) ||
//       !mongoose.Types.ObjectId.isValid(customerId)
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Invalid serviceProviderId or customerId" });
//     }
//     console.log("enter 0.2");
//     // Validate rating
//     if (typeof rating !== "number" || rating < 1 || rating > 5) {
//       return res
//         .status(400)
//         .json({ message: "Invalid rating. Must be a number between 1 and 5." });
//     }
//     console.log("enter 0.3");
//     // Find the service provider by ID
//     const serviceProviderData = await serviceProvider.findById(
//       serviceProviderId
//     );
//     console.log("enter 0.5");
//     if (!serviceProviderData) {
//       return res.status(404).json({ message: "Service provider not found" });
//     }
//     console.log("enter 1");
//     // Check if the customer has already submitted a review
//     const existingRating = serviceProviderData.rating.find(
//       (r) => r.customerId.toString() === customerId
//     );
//     if (existingRating) {
//       return res
//         .status(400)
//         .json({ message: "Customer has already submitted a review." });
//     }
//     console.log("enter 2");
//     // Create a new rating object
//     const newRating = {
//       comment,
//       rating,
//       customerId,
//     };
//     console.log("enter 3");
//     // Add the new rating to the service provider's ratings array
//     serviceProviderData.rating.push(newRating);
//     await serviceProviderData.save();

//     res.status(200).json({ message: "Rating added successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", err });
//   }
// });
router.post("/add_rating", verifyToken, async (req, res) => {
  try {
    const { comment, rating, serviceProviderId, customerId } = req.body;
    console.log("enter 0");

    // Validate serviceProviderId and customerId
    if (
      !mongoose.Types.ObjectId.isValid(serviceProviderId) ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid serviceProviderId or customerId" });
    }

    console.log("enter 0.2");

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Invalid rating. Must be a number between 1 and 5." });
    }

    console.log("enter 0.4");

    // Find the service provider by ID
    const serviceProviderData = await serviceProvider.findById(
      serviceProviderId
    );
    if (!serviceProviderData) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    console.log("enter 0.5");

    // Check if the customer has already submitted a review
    const existingRatingIndex = serviceProviderData.rating.findIndex(
      (r) => r.customerId.toString() === customerId
    );

    if (existingRatingIndex !== -1) {
      // If the rating by the customer exists, update the existing rating
      serviceProviderData.rating[existingRatingIndex].comment = comment;
      serviceProviderData.rating[existingRatingIndex].rating = rating;
    } else {
      // If the rating by the customer does not exist, create a new rating object
      const newRating = {
        comment,
        rating,
        customerId,
      };
      console.log(newRating);
      console.log("enter 3");

      // Add the new rating to the service provider's ratings array
      serviceProviderData.rating.push(newRating);
    }
    // Mark the document as modified to ensure Mongoose detects the change
    serviceProviderData.markModified("rating");

    await serviceProviderData.save();

    console.log("enter 4", serviceProviderData);

    res.status(200).json({ message: "Rating added or updated successfully" });
  } catch (err) {
    console.error("Error in /add_rating route:", err);
    res.status(500).json({ message: "Server error", err });
  }
});

router.post("/getDetailsSP", verifyToken, async (req, res) => {
  const { ids } = req.body; // Expecting an array of IDs in the request body
  console.log(ids);
  try {
    const users = await serviceProvider.find({ _id: { $in: ids } });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found." });
    }

    res
      .status(200)
      .json({ success: true, message: "User details given.", users });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching user details.",
    });
  }
});

module.exports = router;
