const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    reportedUserId: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      required: true,
    },
    reportedByType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
