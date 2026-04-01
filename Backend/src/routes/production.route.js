import express from "express";
import auth from "../middlewares/auth.middleware.js";
import { createProduction, listProductions, editProduction, deleteProduction } from "../controllers/production.controller.js";

const router = express.Router();

router.use(auth);

router.post("/", createProduction);
router.get("/", listProductions);
router.put("/:id", editProduction);
router.delete("/:id", deleteProduction);

export default router;
