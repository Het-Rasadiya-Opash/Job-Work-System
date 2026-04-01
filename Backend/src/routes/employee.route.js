import express from "express";
import auth from "../middlewares/auth.middleware.js";
import { createEmployee, listEmployees, editEmployee, deleteEmployee } from "../controllers/employee.controller.js";

const router = express.Router();

router.use(auth);

router.post("/", createEmployee);
router.get("/", listEmployees);
router.put("/:id", editEmployee);
router.delete("/:id", deleteEmployee);

export default router;
