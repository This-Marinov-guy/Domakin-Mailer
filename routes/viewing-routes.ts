import { Router } from "express";
import { sendRegisteredViewing } from "../controllers/viewing-controller.js";

const router = Router();

router.post("/send-registered-viewing", sendRegisteredViewing);

export default router;
