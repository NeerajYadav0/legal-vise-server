const router = require("express").Router();

const jwt = require("jsonwebtoken");
const Jobs = require("../models/jobs");
// const verifyToken = require("./../middleware/auth");
const serviceProvider = require("../models/serviceProvider");
const Customer = require("../models/customer");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dtr3t5cde",
  api_key: "716364482187956",
  api_secret: "C_-nlN731fySJcnvtoQio6o3v5g",
});
const storage = multer.memoryStorage();
const mongoose = require("mongoose");

const { verifyToken, verifyAdmin } = require("./../middleware/auth");

const upload = multer({ storage: storage });

//READ ALL JOBS
router.get("/getAll", verifyToken, async (req, res) => {
  try {
    // const query = await Jobs.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const jobs = await Jobs.find();
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get single job
router.get("/getOne/:jobId", verifyToken, async (req, res) => {
  try {
    // const query = await Jobs.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const job = await Jobs.findById(req.params.jobId);
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: "Job not found" });
  }
});

//CREATE
router.post(
  "/create",
  verifyToken,
  upload.array("pictures"),
  async (req, res) => {
    console.log("====================================");
    console.log(req.body.pictures);
    console.log("====================================");
    // exp
    const pictures = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(req.files);
      try {
        const base64String = file.buffer.toString("base64");

        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${base64String}`,
          {
            folder: "your_folder_name", // Optional folder in Cloudinary
            use_filename: true,
          }
        );

        pictures.push(result.secure_url);
      } catch (error) {
        console.error("Error uploading image:", error);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    // exp
    // console.log(req.body.category.split(", "));
    console.log(req.body.category.split(","));
    const jobs = new Jobs({
      customerId: req.body.customerId,
      jobName: req.body.jobName,
      jobDesc: req.body.jobDesc,
      category: req.body.category.split(","),
      isActive: req.body.isActive,
      jobPincode: req.body.jobPincode,
      jobLocation: req.body.jobLocation,
      // jobOptions: req.body.jobOptions,
      pictures: pictures,
      state: req.body.state,
      city: req.body.city,
    });
    try {
      const savedJobs = await jobs.save();
      res.status(200).json(savedJobs);
      // console.log(savedJobs);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

//GET CUSTOMER JOBS
router.get("/find/:customerId", verifyToken, async (req, res) => {
  try {
    const jobs = await Jobs.find({ customerId: req.params.customerId });
    if (!jobs) {
      res.status(202).json("Job does not exist");
    } else {
      res.status(200).json(jobs);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET A SPECIFIC LOCATION JOB
router.post("/jobSearchByLocation", verifyToken, async (req, res) => {
  const state = req.body.state;
  const city = req.body.city;
  try {
    var jobs = {};
    if (state === "" && city === "") {
      jobs = await Jobs.find();
      // res.status(200).json(jobs);
    } else if (city === "") {
      jobs = await Jobs.find({ state: state });
      // res.status(200).json(jobs);
    } else if (state === "") {
      jobs = await Jobs.find({ city: city });
      // res.status(200).json(jobs);
    } else {
      jobs = await Jobs.find({
        state: state,
        city: city,
      });
      // console.log(jobs);
    }
    if (!jobs) {
      res.status(202).json("Job does not exist");
    } else {
      res.status(200).json(jobs);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/update/:id", verifyToken, async (req, res) => {
  console.log("====================================");
  console.log(req.params.id);
  console.log("====================================");
  try {
    const updatedJobs = await Jobs.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    res.status(200).json(updatedJobs);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const temp = await Jobs.findByIdAndDelete(req.params.id);
    if (!temp) {
      res.status(202).json("Job does not exist");
    } else {
      res.status(200).json("Job has been deleted..");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Apply Job
router.post("/interested", verifyToken, async (req, res) => {
  const { jobId, serviceProviderId, approxAmount, comments } = req.body;
  console.log("====================================");
  console.log(req.body);
  console.log("====================================");
  const job = await Jobs.findById(jobId);
  var obj = {
    serviceProviderId: serviceProviderId,
    approxAmount: approxAmount,
    comments: comments,
  };
  let temp = true;
  for (var i = 0; i < job.interested.length; i++) {
    if (job.interested[i].serviceProviderId === serviceProviderId) {
      res.status(200).json("user already registered");
      temp = false;
      break;
    }
  }
  if (temp) {
    await Jobs.findByIdAndUpdate(jobId, { $push: { interested: obj } });

    try {
      const result = await serviceProvider.findByIdAndUpdate(
        serviceProviderId,
        {
          $push: { jobs: jobId },
        }
      );
      // console.log(result);
      res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
});

// get applied status
// Apply Job
router.post("/checkInterested/", verifyToken, async (req, res) => {
  try {
    const { jobId, serviceProviderId } = req.body;
    const job = await Jobs.findById(jobId);
    const legalist = await serviceProvider.findById(serviceProviderId);
    let intereastCheck = false;
    let wishlistCheck = false;
    for (var i = 0; i < job.interested.length; i++) {
      if (job.interested[i].serviceProviderId === serviceProviderId) {
        intereastCheck = true;
        break;
      }
    }
    for (var i = 0; i < legalist.wishlist.length; i++) {
      if (legalist.wishlist[i] === jobId) {
        wishlistCheck = true;
        break;
      }
    }

    res.status(200).json({
      success: true,
      userFound: intereastCheck,
      wishlist: wishlistCheck,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
});

//update proposal

//delete proposal

//update job status
router.put("/updateJobStatus/:id", verifyToken, async (req, res) => {
  try {
    const job = await Jobs.findById(req.params.id);
    const updatedJobs = await Jobs.findByIdAndUpdate(req.params.id, {
      isActive: !job.isActive,
    });

    res.status(200).json(updatedJobs);
  } catch (err) {
    res.status(500).json(err);
  }
});

// selected in job
router.post("/selected", verifyToken, async (req, res) => {
  const { jobId, serviceProviderId } = req.body;

  try {
    // Find the job by jobId and update the selected field
    const job = await Jobs.findByIdAndUpdate(
      jobId,
      { selected: serviceProviderId },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Find the service provider by serviceProviderId and update the selectedJobs array
    const serviceProviderData = await serviceProvider.findByIdAndUpdate(
      serviceProviderId,
      { $push: { selectedJobs: jobId } },
      { new: true }
    );

    if (!serviceProviderData) {
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });
    }

    res.status(200).json({
      success: true,
      message: "Job and service provider updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// selected in job
router.post("/job_confirmation", verifyToken, async (req, res) => {
  try {
    const { jobId, serviceProviderId } = req.body;

    // Validate jobId and serviceProviderId
    if (
      !mongoose.Types.ObjectId.isValid(jobId) ||
      !mongoose.Types.ObjectId.isValid(serviceProviderId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid jobId or serviceProviderId" });
    }

    // Find the job by jobId and update its started field to true
    const job = await Jobs.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    job.started = true;
    await job.save();

    // Retrieve the customerId from the job
    const customerId = job.customerId;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId in job" });
    }

    // Find the customer by customerId
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update the readyForRating array if serviceProviderId is not already present
    if (!customer.readyForRating.includes(serviceProviderId)) {
      customer.readyForRating.push(serviceProviderId);
      await customer.save();
    }

    res.status(200).json({ message: "Job confirmation successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
