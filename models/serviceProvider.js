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
      min: 6,
      max: 1024,
    },
    city: {
      type: String,
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
    tenthMarksheet: {
      type: String,
    },
    twelthMarksheet: {
      type: String,
    },
    graduationMarksheet: {
      type: String,
    },
    category: {
      type: Array,
      required: true,
    },
    rating: {
      type: Object,
      default: {},
    },
    categoryData: {
      type: Object,
      default: {},
    },
    pincode: {
      type: Number,
    },
    type: {
      type: String,
      default: "serviceProvider",
    },
    wishlist: {
      type: Array,
      default: [],
    },
    about: {
      type: String,
    },
    unlock_count: {
      type: Number,
      default: 0,
    },
    pictures: {
      type: Array,
      default: [],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    selectedJobs: {
      type: Array,
      default: [],
    },

    gender: {
      type: String,
    },
    dob: {
      type: Date,
    },

    about: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceProvider", ServiceProviderSchema);
