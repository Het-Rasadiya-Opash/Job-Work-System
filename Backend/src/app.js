import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import companyRouter from "./routes/company.route.js";
import userRouter from "./routes/user.route.js";
import vepariRouter from "./routes/vepari.route.js";
import brokerRouter from "./routes/broker.route.js";
import designRouter from "./routes/design.route.js";
import jobcardRouter from "./routes/jobcard.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import reportRouter from "./routes/report.route.js";
import challanRouter from "./routes/challan.route.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.use("/api/company", companyRouter);
app.use("/api/user", userRouter);
app.use('/api/vepari', vepariRouter);
app.use('/api/broker', brokerRouter);
app.use('/api/design', designRouter);
app.use('/api/jobcard', jobcardRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/report', reportRouter);
app.use('/api/challan', challanRouter);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
  connectDB();
  console.log(`server is running on port ${process.env.PORT}`);
});
