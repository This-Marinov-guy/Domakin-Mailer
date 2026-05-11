import { Router } from "express";
import {
  sendListRoomBroadcast,
  sendRemoteViewingBroadcast,
} from "../controllers/broadcast-controller.js";

const router = Router();

router.post("/send-remote-viewing", sendRemoteViewingBroadcast);
router.post("/send-list-room", sendListRoomBroadcast);

export default router;
