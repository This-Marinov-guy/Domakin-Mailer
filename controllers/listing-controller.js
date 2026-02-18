import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import {
  APPROVED_LISTING_TEMPLATE,
  SUBMITTED_LISTING_TEMPLATE,
  INFO_NEEDED_TEMPLATE,
  REJECT_LISTING_TEMPLATE,
} from "../utils/templates.js";

function requireEmail(body) {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

/**
 * POST body: { email, id?, ...templateVariables }
 */
export async function sendApprovedListing(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(APPROVED_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Approved listing email sent" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST body: { email, id?, ...templateVariables }
 */
export async function sendSubmittedListing(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(SUBMITTED_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Submitted listing email sent" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST body: { email, id?, ...templateVariables }
 */
export async function sendInfoNeeded(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(INFO_NEEDED_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Info needed email sent" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST body: { email, id?, ...templateVariables }
 */
export async function sendRejectListing(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(REJECT_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Reject listing email sent" });
  } catch (err) {
    next(err);
  }
}
