const router = require("express").Router();
const bcrypt = require("bcryptjs");
const admin = require("../models/admin");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  console.log("123");
  const salt = await bcrypt.genSalt();

  const adm = new admin({
    email: req.body.email,
    password: await bcrypt.hash(req.body?.password, salt),
  });

  try {
    const user = await adm.save();
    res.status(201).json({
      success: true,
      message: "Admin Registered!",
      user: user,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    var user = await admin.findOne({ email: req.body.email });
    console.log(user);
    if (!user) {
      !user && res.status(401).json("Wrong Credentials");
    } else {
      var userEmail = user.email;
      var isMatch = await bcrypt.compare(req.body?.password, user.password);
      console.log(isMatch);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "Invalid id or pass", success: false });
      var type = user.type;
      var token = jwt.sign({ userEmail, type }, process.env.JWT_SECRET);
      console.log(token);
      delete user.password;
      res.status(200).json({ token, user, type, success: true });
    }
  } catch (error) {
    res.status(500).json({ error, success: false });
  }
});

module.exports = router;
