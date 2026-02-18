import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { LISTING_REMINDER_TEMPLATE } from "../utils/templates.js";

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

export async function listProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = (body.id as string | undefined) ?? "";
    const name = typeof body.name === "string" ? body.name : "";
    const city = typeof body.city === "string" ? body.city : "";
    const blog_posts = parseBlogPosts(body.blog_posts);
    const templateVariables: Record<string, unknown> = {
      name,
      city,
      blog_posts,
    };
    await sendMarketingEmail(LISTING_REMINDER_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "List property reminder email sent" });
  } catch (err) {
    next(err);
  }
}
