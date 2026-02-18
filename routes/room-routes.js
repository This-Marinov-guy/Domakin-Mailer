import { Router } from "express";
import { sendNewRoom, sendFinishApplication } from "../controllers/room-controller.js";

const router = Router();

router.post("/send-new-room", sendNewRoom);
router.post("/send-finish-application", sendFinishApplication);

export default router;
