const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const EducationalVideo = require("../models/educationalVideo"); // Adjust the path as needed
const { verifyToken, verifyAdmin } = require("./../middleware/auth");
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dtr3t5cde",
  api_key: "716364482187956",
  api_secret: "C_-nlN731fySJcnvtoQio6o3v5g",
});

// Configure Multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "your_folder_name", // Optional folder in Cloudinary
    resource_type: "video", // Set resource type to video
    format: async (req, file) => "mp4", // Supports promises as well
    public_id: (req, file) => file.originalname.split(".")[0], // Use file name without extension
  },
});

const upload = multer({ storage: storage });

// Route to handle the video upload and save title and video URL to the database
router.post(
  "/upload",
  verifyToken,
  verifyAdmin,
  upload.single("video"),
  async (req, res) => {
    try {
      const { title } = req.body;
      const video = req.file.path; // Path to the uploaded video on Cloudinary

      if (!title || !video) {
        return res
          .status(400)
          .json({ message: "Title and video are required" });
      }

      const newVideo = new EducationalVideo({
        title,
        video,
      });

      await newVideo.save();
      res.status(201).json({
        message: "Video uploaded and saved successfully",
        video: newVideo,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const videos = await EducationalVideo.find();
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error getting videos:", error);
    res.status(500).json({ message: "Failed to get videos" });
  }
});

router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVideo = await EducationalVideo.findByIdAndDelete(id);
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }
    res
      .status(200)
      .json({ message: "Video deleted successfully", video: deletedVideo });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Failed to delete video" });
  }
});

module.exports = router;
