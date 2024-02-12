const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const customer = require("../models/customer");
const router = require("express").Router();

router.post("/register", async (req,res)=>{
    const salt = await bcrypt.genSalt();
    const cust = new customer({
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, salt),
        state: req.body.state,
        city: req.body.city,
        phoneNumber: req.body.phoneNumber,
        aadharNumber: req.body.aadharNumber,
    });

    try {
        const user = await cust.save();
        // console.log(savedFarmer);
        res.status(201).json(user);
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



module.exports = router;