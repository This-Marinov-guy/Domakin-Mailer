import { Router } from "express";
import { listProperty } from "../controllers/reminder-controller.js";

const router = Router();

router.post("/list-property", listProperty);

export default router;
