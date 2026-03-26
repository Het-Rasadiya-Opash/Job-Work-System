import express from "express";
import {
  getPendingStock,
  getBrokerCommission,
  getVepariLedger,
  getProductionSummary,
} from "../controllers/report.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router.get("/pending-stock", getPendingStock);
router.get("/broker-commission", getBrokerCommission);
router.get("/vepari-ledger", getVepariLedger);
router.get("/production-summary", getProductionSummary);

export default router;
