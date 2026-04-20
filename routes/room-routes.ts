import { Router } from "express";
import {
  sendNewRoom,
  sendFinishApplication,
  previewNewRoomToCitySubscribersForProperty,
  sendNewRoomToCitySubscribersForProperty,
} from "../controllers/room-controller.js";

const router = Router();

router.post("/send-new-room", sendNewRoom);
router.post("/send-finish-application", sendFinishApplication);
router.post("/preview-new-room-city-campaign", previewNewRoomToCitySubscribersForProperty);
router.post("/send-new-room-city-campaign", sendNewRoomToCitySubscribersForProperty);

export default router;
