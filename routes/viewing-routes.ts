import { Router } from "express";
import {
  sendApprovedViewing,
  sendRegisteredViewing,
  sendRejectedViewing,
} from "../controllers/viewing-controller.js";

const router = Router();

router.post("/send-registered-viewing", sendRegisteredViewing);
router.post("/send-approved-viewing", sendApprovedViewing);
router.post("/send-rejected-viewing", sendRejectedViewing);

export default router;
