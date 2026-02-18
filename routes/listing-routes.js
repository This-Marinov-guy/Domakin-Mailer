import { Router } from "express";
import {
  sendApprovedListing,
  sendSubmittedListing,
  sendInfoNeeded,
  sendRejectListing,
} from "../controllers/listing-controller.js";

const router = Router();

router.post("/send-approved-listing", sendApprovedListing);
router.post("/send-submitted-listing", sendSubmittedListing);
router.post("/send-info-needed", sendInfoNeeded);
router.post("/send-reject-listing", sendRejectListing);

export default router;
