import express from "express";
import { createBroker, listBrokers, editBroker, deleteBroker } from "../controllers/broker.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, createBroker);
router.get("/", auth, listBrokers);
router.put("/:id", auth, editBroker);
router.delete("/:id", auth, deleteBroker);

export default router;
