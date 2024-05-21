const router = require("express").Router();
const verifyToken = require("./../middleware/auth");
const jwt = require("jsonwebtoken");
const Jobs = require("../models/jobs");
// const verifyToken = require("./../middleware/auth");
const serviceProvider = require("../models/serviceProvider");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dtr3t5cde",
  api_key: "716364482187956",
  api_secret: "C_-nlN731fySJcnvtoQio6o3v5g",
});
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

//READ ALL JOBS
router.get("/getAll", async (req, res) => {
  try {
    // const query = await Jobs.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const jobs = await Jobs.find();
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get single job
router.get("/getOne/:jobId", async (req, res) => {
  try {
    // const query = await Jobs.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const job = await Jobs.findById(req.params.jobId);
    res.status(200).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: "Job not found" });
  }
});

//CREATE
router.post("/create", upload.array("pictures"), async (req, res) => {
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
  const jobs = new Jobs({
    customerId: req.body.customerId,
    jobName: req.body.jobName,
    jobDesc: req.body.jobDesc,
    category: req.body.category,
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
});

//GET CUSTOMER JOBS
router.get("/find/:customerId", async (req, res) => {
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
router.post("/jobSearchByLocation", async (req, res) => {
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
router.put("/update/:id", async (req, res) => {
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
router.delete("/delete/:id", async (req, res) => {
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
router.post("/interested", async (req, res) => {
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
router.post("/checkInterested/", async (req, res) => {
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
router.put("/updateJobStatus/:id", async (req, res) => {
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
router.post("/selected", async (req, res) => {
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

module.exports = router;
