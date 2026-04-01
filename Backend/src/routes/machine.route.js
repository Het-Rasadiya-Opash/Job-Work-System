import express from "express";
import auth from "../middlewares/auth.middleware.js";
import { createMachine, listMachines, editMachine, deleteMachine } from "../controllers/machine.controller.js";

const router = express.Router();

router.use(auth);

router.post("/", createMachine);
router.get("/", listMachines);
router.put("/:id", editMachine);
router.delete("/:id", deleteMachine);

export default router;
