import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { sendNewRoomsForCriteriaEmail } from "../services/send-new-rooms-email.js";
import { FINISH_LISTING_TEMPLATE } from "../utils/templates.js";

function requireEmail(body) {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

/**
 * POST body: { email, id?, language? }. Sends new-room email using property + blog data from DB.
 */
export async function sendNewRoom(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const language = req.body?.language ?? "en";
    const receiver = { email, id };
    await sendNewRoomsForCriteriaEmail(receiver, language);
    res.json({ ok: true, message: "New room email sent" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST body: { email, id?, name, step, city, address, ... }. Sends finish-listing email.
 */
export async function sendFinishApplication(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const templateVariables = {
      name: req.body?.name ?? "",
      step: req.body?.step ?? "",
      city: req.body?.city ?? "",
      address: req.body?.address ?? "",
      ...req.body,
      email,
      id,
    };
    await sendMarketingEmail(FINISH_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Finish application email sent" });
  } catch (err) {
    next(err);
  }
}
