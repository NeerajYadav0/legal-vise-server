const router = require("express").Router();
const verifyToken = require("./../middleware/auth");
const jwt = require("jsonwebtoken");
const Jobs = require("../models/jobs");
// const verifyToken = require("./../middleware/auth");
const serviceProvider = require("../models/serviceProvider");

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

  //CREATE
router.post("/create", async (req, res) => {
  console.log('====================================');
  console.log(req.body);
  console.log('====================================');
    const jobs = new Jobs({
        customerId : req.body.customerId,
        jobName: req.body.jobName,
        jobDesc: req.body.jobDesc,
        category: req.body.category,
        isActive: req.body.isActive,
        jobPincode: req.body.jobPincode,
        jobLocation: req.body.jobLocation,
        // jobOptions: req.body.jobOptions,
        pictures: req.body.pictures,
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
      if (state === "" && city === "" ) {
        jobs = await Jobs.find();
        // res.status(200).json(jobs);
      } else if (city === "") {
        jobs = await Jobs.find({ state: state });
        // res.status(200).json(jobs);
      } 
      else if (state === "") {
        jobs = await Jobs.find({ city: city });
        // res.status(200).json(jobs);
      }
      else {
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
  console.log('====================================');
  console.log(req.params.id);
  console.log('====================================');
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
    const {jobId, serviceProviderId, approxAmount, comments} = req.body;
    console.log('====================================');
    console.log(req.body);
    console.log('====================================');
    const job = await Jobs.findById(jobId);
    var obj = { serviceProviderId: serviceProviderId, approxAmount: approxAmount, comments: comments };
    let temp = true;
    for (var i = 0; i < job.interested.length; i++) {
        if (job.interested[i].serviceProviderId === serviceProviderId) {
        

            res.status(200).json("user already registered");
            temp = false;
          break;
        }
      }
     if(temp) {
      await Jobs.findByIdAndUpdate(jobId, { $push: { interested: obj } });

      try {
        const result = await serviceProvider.findByIdAndUpdate(
          serviceProviderId ,
          {
            $push: { jobs: jobId },
          }
        );
        // console.log(result);
        res.status(200).json(result);
      } catch (err) {
        console.log(err);
        res.status(500).json(err);
      }}

  });

  //update proposal

  //delete proposal 

  //update job status
  router.put("/updateJobStatus/:id", async (req, res) => {
    try {
      const job = await Jobs.findById(req.params.id);
      const updatedJobs = await Jobs.findByIdAndUpdate(
        req.params.id,
        {
            isActive: ! job.isActive
        }
      );
  
      res.status(200).json(updatedJobs);
    } catch (err) {
      res.status(500).json(err);
    }
  });


  module.exports = router;