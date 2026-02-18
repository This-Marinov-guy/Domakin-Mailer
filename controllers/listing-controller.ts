import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import {
  APPROVED_LISTING_TEMPLATE,
  SUBMITTED_LISTING_TEMPLATE,
  INFO_NEEDED_TEMPLATE,
  REJECT_LISTING_TEMPLATE,
} from "../utils/templates.js";

function requireEmail(body: Record<string, unknown>): string {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

export async function sendApprovedListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(APPROVED_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Approved listing email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendSubmittedListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(SUBMITTED_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Submitted listing email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendInfoNeeded(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(INFO_NEEDED_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Info needed email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendRejectListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const templateVariables = { ...req.body, email, id };
    await sendMarketingEmail(REJECT_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Reject listing email sent" });
  } catch (err) {
    next(err);
  }
}
