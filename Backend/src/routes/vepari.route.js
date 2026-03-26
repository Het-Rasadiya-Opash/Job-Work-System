import express from "express";
import { createVepari, listVeparis, editVepari, deleteVepari } from "../controllers/vepari.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, createVepari);
router.get("/", auth, listVeparis);
router.put("/:id", auth, editVepari);
router.delete("/:id", auth, deleteVepari);

export default router;
