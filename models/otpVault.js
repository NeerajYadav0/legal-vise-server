const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
   mobileNo:{
      required:true,
      type: Number,
   },
   otp:{
      required:true,
      type: Number,
   },
   expirationDate: { 
      type: Date, 
      required: true, 
      default: Date.now()  
   }
},{timestamps: true});

OtpSchema.index({expirationDate: 1},{expireAfterSeconds: 300});


module.exports = mongoose.model("OtpVault", OtpSchema);
