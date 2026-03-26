import express from "express";
import { printChallan, listChallans, editChallan } from "../controllers/challan.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router.get("/", listChallans);
router.get("/:id/print", printChallan);
router.put("/:id", editChallan);

export default router;
