import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { sendNewRoomsForCriteriaEmail } from "../services/send-new-rooms-email.js";
import { FINISH_LISTING_TEMPLATE } from "../utils/templates.js";

function requireEmail(body: Record<string, unknown>): string {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

export async function sendNewRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const language = (req.body?.language as string | undefined) ?? "en";
    const receiver = { email, id };
    await sendNewRoomsForCriteriaEmail(receiver, language);
    res.json({ ok: true, message: "New room email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendFinishApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = requireEmail(req.body as Record<string, unknown>);
    const id = (req.body?.id as string | undefined) ?? "";
    const templateVariables = {
      name: (req.body?.name as string | undefined) ?? "",
      step: (req.body?.step as string | undefined) ?? "",
      city: (req.body?.city as string | undefined) ?? "",
      address: (req.body?.address as string | undefined) ?? "",
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
