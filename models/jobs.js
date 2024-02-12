const mongoose = require("mongoose");

const JobsSchema = new mongoose.mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  jobName: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  jobDesc: {
    type: String,
    required: true,
    min: 6,
  },
  category:{
    type: Array,
      default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true,
  },
  jobPincode:{
    type: Number,
    required:true
  },
  jobLocation:{
    type:String,
    required:true
  },
  interested: {
    type: Array,
    default: [],
    required: true,
  },
  pictures: {
    type: Array,
    default: [],
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Jobs", JobsSchema);
