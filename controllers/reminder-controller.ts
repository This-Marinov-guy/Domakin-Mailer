import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { LISTING_REMINDER_TEMPLATE } from "../utils/templates.js";

function requireEmail(body: Record<string, unknown>): string {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

export async function listProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(LISTING_REMINDER_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "List property reminder email sent" });
  } catch (err) {
    next(err);
  }
}
