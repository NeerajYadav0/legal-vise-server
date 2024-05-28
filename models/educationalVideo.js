const mongoose = require("mongoose");

const EducationalVideo = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EducationalVideo", EducationalVideo);
