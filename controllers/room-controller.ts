import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { sendNewRoomsForCriteriaEmail } from "../services/send-new-rooms-email.js";
import { FINISH_LISTING_TEMPLATE } from "../utils/templates.js";
import { progressPercentFromStep } from "../utils/helpers.js";

function requireEmail(body: Record<string, unknown>): string {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

function parseBlogPosts(raw: unknown): { url: string; image: string; title: string; excerpt: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      url: typeof o.url === "string" ? o.url : "",
      image: typeof o.image === "string" ? o.image : "",
      title: typeof o.title === "string" ? o.title : "",
      excerpt: typeof o.excerpt === "string" ? o.excerpt : "",
    };
  });
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
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = (body.id as string | undefined) ?? "";
    const name = typeof body.name === "string" ? body.name : "";
    const address = typeof body.address === "string" ? body.address : "";
    const city = typeof body.city === "string" ? body.city : "";
    const stepRaw = body.step;
    const step = typeof stepRaw === "number" && Number.isFinite(stepRaw) ? stepRaw : Number(stepRaw) || 0;
    const progress_percent = progressPercentFromStep(step);
    const link = typeof body.link === "string" ? body.link : "";
    const blog_posts = parseBlogPosts(body.blog_posts);
    const templateVariables: Record<string, unknown> = {
      name,
      address,
      city,
      progress_percent,
      link,
      blog_posts,
    };
    await sendMarketingEmail(FINISH_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Finish application email sent" });
  } catch (err) {
    next(err);
  }
}
