import express from "express";
import { createDesign, listDesign, editDesign, deleteDesign, createDesignPart, listDesignParts } from "../controllers/design.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/part", auth, createDesignPart);
router.get("/part", auth, listDesignParts);

router.post("/", auth, createDesign);
router.get("/", auth, listDesign);
router.put("/:id", auth, editDesign);
router.delete("/:id", auth, deleteDesign);

export default router;
