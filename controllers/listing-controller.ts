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

/** Blog post item for listing template (e.g. submitted listing). */
interface ListingBlogPost {
  url: string;
  image: string;
  title: string;
  excerpt: string;
}

function parseListingBlogPosts(raw: unknown): ListingBlogPost[] {
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

/** Specification item for info-needed template. */
interface ListingSpecification {
  this: string;
}

function parseSpecifications(raw: unknown): ListingSpecification[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { this: item };
    const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return { this: typeof o.this === "string" ? o.this : "" };
  });
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
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = (body.id as string | undefined) ?? "";
    const name = typeof body.name === "string" ? body.name : "";
    const address = typeof body.address === "string" ? body.address : "";
    const city = typeof body.city === "string" ? body.city : "";
    const blog_posts = parseListingBlogPosts(body.blog_posts);
    const templateVariables: Record<string, unknown> = {
      name,
      address,
      city,
      blog_posts,
    };
    await sendMarketingEmail(SUBMITTED_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Submitted listing email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendInfoNeeded(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = (body.id as string | undefined) ?? "";
    const name = typeof body.name === "string" ? body.name : "";
    const address = typeof body.address === "string" ? body.address : "";
    const city = typeof body.city === "string" ? body.city : "";
    const specifications = parseSpecifications(body.specifications);
    const blog_posts = parseListingBlogPosts(body.blog_posts);
    const templateVariables: Record<string, unknown> = {
      name,
      address,
      city,
      specifications,
      blog_posts,
    };
    await sendMarketingEmail(INFO_NEEDED_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Info needed email sent" });
  } catch (err) {
    next(err);
  }
}

export async function sendRejectListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const email = requireEmail(body);
    const id = (body.id as string | undefined) ?? "";
    const name = typeof body.name === "string" ? body.name : "";
    const address = typeof body.address === "string" ? body.address : "";
    const city = typeof body.city === "string" ? body.city : "";
    const reason = typeof body.reason === "string" ? body.reason : "";
    const blog_posts = parseListingBlogPosts(body.blog_posts);
    const templateVariables: Record<string, unknown> = {
      name,
      address,
      city,
      reason,
      blog_posts,
    };
    await sendMarketingEmail(REJECT_LISTING_TEMPLATE, { email, id }, templateVariables);
    res.json({ ok: true, message: "Reject listing email sent" });
  } catch (err) {
    next(err);
  }
}
