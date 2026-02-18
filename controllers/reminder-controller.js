import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { LISTING_REMINDER_TEMPLATE } from "../utils/templates.js";

function requireEmail(body) {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

/**
 * POST body: { email, id?, ...templateVariables }. Sends list-property reminder email.
 */
export async function listProperty(req, res, next) {
  try {
    const email = requireEmail(req.body);
    const id = req.body?.id ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(LISTING_REMINDER_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "List property reminder email sent" });
  } catch (err) {
    next(err);
  }
}
