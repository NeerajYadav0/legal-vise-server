const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const customer = require("../models/customer");
const router = require("express").Router();
const OtpVault = require("../models/otpVault");
const serviceProvider = require("../models/serviceProvider");
const { verifyToken, verifyAdmin } = require("./../middleware/auth");

// const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const Report = require("../models/report"); // Import Report model

// Route to insert data into Report table
router.post("/reportUser", verifyToken, async (req, res) => {
  const { reportedUserId, reportedBy, comments, reportedByType } = req.body;

  // Validate that all required fields are present
  if (!reportedUserId || !reportedBy || !comments || !reportedByType) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    // Check if a report already exists
    let report = await Report.findOne({ reportedUserId, reportedBy });

    if (report) {
      // If a report already exists, update it with the latest data
      report.comments = comments;
      report.reportedByType = reportedByType;
      await report.save();
    } else {
      // If no report exists, create a new report
      report = new Report({
        reportedUserId,
        reportedBy,
        comments,
        reportedByType,
      });
      await report.save();
    }

    res.status(200).json({
      success: true,
      message: "Report submitted successfully.",
      report,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "An error occurred while reporting the user.",
      error: err.message,
    });
  }
});

//get user details
router.post("/updateProfile", verifyToken, async (req, res) => {
  try {
    const type = req?.body.type;
    if (type == "customer") {
      await customer.findByIdAndUpdate(req.body.user._id, req.body.user);
      res
        .status(202)
        .json({ success: true, message: "User updates successfully" });
    } else if (type == "serviceProvider") {
      await serviceProvider.findByIdAndUpdate(req.body.user._id, req.body.user);
      res
        .status(202)
        .json({ success: true, message: "User updates successfully" });
    }
    res
      .status(404)
      .json({ success: false, message: `${type} category not found` });
  } catch (err) {
    res.status(500).json({ success: false, message: "User not found." });
  }
});
//verify jwt token
// router.post("/verifyToken", async (req, res) => {
//   try {
//     let token = req.headers["authorization"]?.split(" ")[1];

//     if (!token) return res.status(403).json("access denied");

//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified;
//     res.status(200).json({ success: true, message: "token verified" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Invalid Token." });
//   }
// });

router.get(
  "/getAllReportedUsers",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      // Fetch all reports from the Report collection
      const reports = await Report.find();

      // Function to get user details from the appropriate collection
      const getUserDetails = async (reportedByType, reportedUserId) => {
        let collectionName;
        if (reportedByType === "client") {
          collectionName = "serviceproviders";
        } else if (reportedByType === "serviceProvider") {
          collectionName = "customers";
        } else {
          return null;
        }

        let query = { _id: reportedUserId };

        // Attempt to convert to ObjectId
        if (mongoose.Types.ObjectId.isValid(reportedUserId)) {
          query = { _id: new mongoose.Types.ObjectId(reportedUserId) };
        }

        // Fetch the user details
        const userDetails = await mongoose.connection
          .collection(collectionName)
          .findOne(query);
        return userDetails;
      };

      // Aggregate the reports
      const reportMap = new Map();

      for (const report of reports) {
        const key = `${report.reportedUserId}_${report.reportedByType}`;
        if (!reportMap.has(key)) {
          reportMap.set(key, {
            reportedUserId: report.reportedUserId,
            reportedByType: report.reportedByType,
            count: 0,
          });
        }
        reportMap.get(key).count += 1;
      }

      // Fetch user details for each aggregated report
      const result = await Promise.all(
        Array.from(reportMap.values()).map(async (report) => {
          const userDetails = await getUserDetails(
            report.reportedByType,
            report.reportedUserId
          );

          // Log if user details are not found
          if (!userDetails) {
            console.error(
              `User not found: ${report.reportedUserId} in collection ${
                report.reportedByType === "client"
                  ? "serviceProviders"
                  : "customers"
              }`
            );
          }

          return {
            reportedUserId: report.reportedUserId,
            reportedByType: report.reportedByType,
            count: report.count,
            userName: userDetails ? userDetails.name : "Unknown",
          };
        })
      );

      res.status(200).json({ success: true, result });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch reported users.",
        error: err.message,
      });
    }
  }
);

// Route to get all reports for a specific user
// Route to get all reports for a specific user
router.get(
  "/getReportsForUser/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID." });
      }

      // Fetch reports for the given user ID
      const reports = await Report.find({ reportedUserId: id });

      // If no reports found
      if (reports.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No reports found for this user." });
      }

      // Function to get reporter details
      const getReporterDetails = async (report) => {
        const { reportedByType, reportedBy } = report;
        let collectionName;

        if (reportedByType === "client") {
          collectionName = "customers";
        } else if (reportedByType === "serviceProvider") {
          collectionName = "serviceproviders";
        } else {
          return null;
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(reportedBy)) {
          return { name: "Unknown" };
        }

        const reporter = await mongoose.connection
          .collection(collectionName)
          .findOne({ _id: new mongoose.Types.ObjectId(reportedBy) });
        return reporter ? { name: reporter.name } : { name: "Unknown" };
      };

      // Fetch reporter details for each report
      const detailedReports = await Promise.all(
        reports.map(async (report) => {
          const reporterDetails = await getReporterDetails(report);
          return {
            ...report.toObject(),
            reportedByName: reporterDetails.name,
          };
        })
      );

      res.status(200).json({ success: true, reports: detailedReports });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch reports.",
        error: err.message,
      });
    }
  }
);

// Block User Route
router.post("/block", verifyToken, verifyAdmin, async (req, res) => {
  const { id, type } = req.body;

  try {
    let user;
    if (type === "serviceProvider") {
      user = await serviceProvider.findById(id);
    } else if (type === "client") {
      user = await customer.findById(id);
    } else {
      return res.status(400).json({ error: "Invalid type specified" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.blocked = true;
    await user.save();

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unblock User Route
router.post("/unblock", verifyToken, verifyAdmin, async (req, res) => {
  const { id, type } = req.body;

  try {
    let user;
    if (type === "serviceProvider") {
      user = await serviceProvider.findById(id);
    } else if (type === "client") {
      user = await customer.findById(id);
    } else {
      return res.status(400).json({ error: "Invalid type specified" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.blocked = false;
    await user.save();

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
