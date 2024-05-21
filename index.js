const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const customerRoute = require("./routes/customer");
const serviceProviderRoute = require("./routes/serviceProvider");
const jobRoute = require("./routes/jobs");
const otpRoute = require("./routes/otp");
const commonRoute = require("./routes/common");
const razorPayRoute = require("./routes/payment");

//configurations
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors({ credentials: true }));

app.use("/api/customer", customerRoute);
app.use("/api/serviceProvider", serviceProviderRoute);
app.use("/api/jobs", jobRoute);
app.use("/api/otp", otpRoute);
app.use("/api/common", commonRoute);
app.use("/api/razorpay", razorPayRoute);

const corsOptions = {
  origin: "https://legal-vise-client.vercel.app", // Allow your frontend's origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
};

// Use the CORS middleware
app.use(cors(corsOptions));

const port = process.env.PORT || 8000;
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGOURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`server running at ${port}`);
    });
  })
  .catch((err) => {
    console.log("Could not connect to database" + err);
  });

app.get("/", (req, res) => {
  res.send("Hey!");
});
