const mongoose = require("mongoose");

const ServiceProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    email: {
      type: String,
      required: true,
      min: 6,
      max: 255,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 1024,
    },
    state: {
      type: String,
      required: true,
      min: 6,
      max: 1024,
    },
    city: {
      type: String,
      required: true,
      min: 6,
      max: 1024,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    aadharNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    jobs: {
      type: Array,
      default: [],
    },
    tenthMarksheet:{
        type: String,
        required: true
    },
    twelthMarksheet:{
        type: String,
        required: true
    },
    graduationMarksheet:{
        type: String,
        required: true
    },
    category:{
        type:String,
        required:true
    },
    rating:{
        type: Object,
        default: {},
    },
    categoryData:{
      type: Object,
      default:{}
    },
    type:{
      type: String,
      default:"serviceProvider"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceProvider", ServiceProviderSchema);
