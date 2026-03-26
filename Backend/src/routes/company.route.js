import express from "express";
import { createCompany, getUserCompanies, getCompanyById, editCompany, deleteCompany } from "../controllers/company.controller.js";
import auth from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create", auth, createCompany);
router.get("/my-firms", auth, getUserCompanies);
router.get("/:id", auth, getCompanyById);
router.put("/edit/:id", auth, editCompany);
router.delete("/delete/:id", auth, deleteCompany);

export default router;
