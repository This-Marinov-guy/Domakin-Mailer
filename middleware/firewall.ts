import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import { allowedIps, allowedOrigins } from "../utils/access.js";
import { requestCache } from "../utils/caches.js";

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === "GET") return next();

  const ip =
    (req.ip ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "unknown") as string;

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 3600;
  const maxRequests = 100;

  let entry = requestCache.get<number[]>(ip);
  if (!entry) {
    requestCache.set(ip, [now]);
    return next();
  }

  entry = entry.filter((timestamp) => timestamp > windowStart);

  if (entry.length >= maxRequests) {
    console.error(`Rate limit exceeded for IP: ${ip}`);
    return next(new HttpError("Rate limit exceeded. Try again later!", 429));
  }

  entry.push(now);
  requestCache.set(ip, entry);
  return next();
};

export const firewall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const origin = req.headers.origin || "unknown origin";
  const connectingIp =
    (req.headers["do-connecting-ip"] as string | undefined) ??
    req.ip ??
    (req.headers["x-forwarded-for"] as string | undefined) ??
    req.socket?.remoteAddress ??
    "unknown IP";

  if (allowedOrigins.includes(origin) || allowedIps.includes(connectingIp)) {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return next();
  } else {
    console.log(origin, connectingIp, req.headers["user-agent"]);
    return next(new HttpError("Forbidden: Access is denied!", 403));
  }
};
