import express from "express";
import { signup, signin, logout } from "../controllers/user.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.get("/me", auth, (req, res) => res.status(200).json({ success: true, user: req.user }));

export default router;
