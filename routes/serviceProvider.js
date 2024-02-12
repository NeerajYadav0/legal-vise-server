const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const serviceProvider = require("../models/serviceProvider")
const router = require("express").Router();
const job = require("../models/jobs");

router.post("/register", async (req,res)=>{
    const salt = await bcrypt.genSalt();
    const provider = new serviceProvider({
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, salt),
        state: req.body.state,
        city: req.body.city,
        phoneNumber: req.body.phoneNumber,
        aadharNumber: req.body.aadharNumber,
        tenthMarksheet:req.body.tenthMarksheet,
        twelthMarksheet:req.body.twelthMarksheet,
        graduationMarksheet:req.body.graduationMarksheet,
        category:req.body.category
    });

    try {
        const user = await provider.save();
        // console.log(savedFarmer);
        res.status(201).json(user);
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
        if (!isMatch) return res.status(400).json("Invalid id or pass");
        var type = user.type;
        var token = jwt.sign({ userEmail, type }, process.env.JWT_SECRET);
        delete user.password;
        res.status(200).json({ token, user, type });
      }
    } catch (err) {
      res.status(500).json(err);
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
 router.get("/getAllServiceProviderJobs/:id", async (req,res)=>{
  try {
    const sp = await serviceProvider.findById(req.params.id);
    const ids = sp.jobs;

    const records = await job.find({ '_id': { $in: ids } });
    res.status(200).send(records);
  } catch (error) {
    res.status(500).json(err);
  }
 })


  module.exports = router;