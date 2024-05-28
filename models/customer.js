const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
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
      default: "",
      min: 6,
      max: 1024,
    },
    city: {
      type: String,
      default: "",
      min: 6,
      max: 1024,
    },
    pincode: {
      type: Number,
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
    profilePic: {
      type: String,
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
    job: {
      type: Array,
      default: [],
    },
    rating: {
      type: Object,
      default: {},
    },
    type: {
      type: String,
      default: "customer",
    },
    unlocked: {
      type: Array,
      default: [],
    },
    favServiceProvider: {
      type: Array,
      default: [],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    readyForRating: {
      type: Array,
      default: [],
    },
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
