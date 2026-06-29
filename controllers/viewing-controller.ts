import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { fetchWordpressPosts } from "./wordpress-controllers.js";
import {
  APPROVED_VIEWING_BG,
  APPROVED_VIEWING_EN,
  REGISTERED_VIEWING_BG,
  REGISTERED_VIEWING_EN,
  REJECTED_VIEWING_BG,
  REJECTED_VIEWING_EN,
} from "../utils/templates.js";

interface ViewingBlogPost {
  url: string;
  image: string;
  title: string;
  excerpt: string;
}

function requireEmail(body: Record<string, unknown>): string {
  const email = body?.email;
  if (!email || typeof email !== "string") throw new HttpError("Missing or invalid email", 400);
  return email.trim();
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

function parseBlogPosts(raw: unknown): ViewingBlogPost[] {
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

async function resolveBlogPosts(raw: unknown): Promise<ViewingBlogPost[]> {
  const providedPosts = parseBlogPosts(raw);
  if (providedPosts.length > 0) return providedPosts;

  try {
    const posts = await fetchWordpressPosts(1, 3);
    return posts.slice(0, 3).map((post) => ({
      url: post.url,
      image: post.thumbnail || "",
      title: post.title,
      excerpt: post.excerpt || "",
    }));
  } catch (error) {
    console.error("[viewing-mailer] Failed to fetch WordPress posts", error);
    return [];
  }
}

function isBulgarian(language: string): boolean {
  return language.toLowerCase().startsWith("bg");
}

function resolveRegisteredViewingTemplate(language: string): string {
  return language.toLowerCase().startsWith("bg")
    ? REGISTERED_VIEWING_BG
    : REGISTERED_VIEWING_EN;
}

function resolveApprovedViewingTemplate(language: string): string {
  return isBulgarian(language) ? APPROVED_VIEWING_BG : APPROVED_VIEWING_EN;
}

function resolveRejectedViewingTemplate(language: string): string {
  return isBulgarian(language) ? REJECTED_VIEWING_BG : REJECTED_VIEWING_EN;
}

function viewingTemplateVariables(
  body: Record<string, unknown>,
  blog_posts: ViewingBlogPost[],
): Record<string, unknown> {
  return {
    name: stringField(body, "name"),
    city: stringField(body, "city"),
    address: stringField(body, "address"),
    date: stringField(body, "date"),
    time: stringField(body, "time"),
    link: stringField(body, "link"),
    reason: stringField(body, "reason"),
    blog_posts,
  };
}

export async function sendRegisteredViewing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = stringField(body, "id");
    const language = stringField(body, "language") || stringField(body, "locale") || "en";
    const blog_posts = await resolveBlogPosts(body.blog_posts);

    const templateVariables = viewingTemplateVariables(body, blog_posts);

    await sendMarketingEmail(resolveRegisteredViewingTemplate(language), { email, id }, templateVariables);
    res.json({ ok: true, message: "Registered viewing email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendApprovedViewing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = stringField(body, "id");
    const language = stringField(body, "language") || stringField(body, "locale") || "en";
    const blog_posts = await resolveBlogPosts(body.blog_posts);

    await sendMarketingEmail(
      resolveApprovedViewingTemplate(language),
      { email, id },
      viewingTemplateVariables(body, blog_posts),
    );
    res.json({ ok: true, message: "Approved viewing email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendRejectedViewing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = stringField(body, "id");
    const language = stringField(body, "language") || stringField(body, "locale") || "en";
    const blog_posts = await resolveBlogPosts(body.blog_posts);

    await sendMarketingEmail(
      resolveRejectedViewingTemplate(language),
      { email, id },
      viewingTemplateVariables(body, blog_posts),
    );
    res.json({ ok: true, message: "Rejected viewing email sent" });
  } catch (err) {
    next(err);
  }
}
