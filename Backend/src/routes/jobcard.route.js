import express from "express";
import { createJobCard, listJobCards, getJobCardDetail, updateJobCardStatus, editJobCard, logInward, logOutward } from "../controllers/jobcard.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, createJobCard);
router.get("/", auth, listJobCards);
router.get("/:id", auth, getJobCardDetail);
router.put("/:id/status", auth, updateJobCardStatus);
router.put("/:id", auth, editJobCard);
router.post("/:id/inward", auth, logInward);
router.post("/:id/outward", auth, logOutward);

export default router;
