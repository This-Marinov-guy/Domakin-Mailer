import type { Request, Response, NextFunction } from "express";
import HttpError from "../models/Http-error.js";
import axios from "axios";
import dotenv from "dotenv";
import type { BlogPost } from "../types/index.js";
dotenv.config();

const ENDPOINT = "public-api.wordpress.com/wp/v2/sites/";
const DOMAKIN_BLOG_URL = "https://www.domakin.nl/blog/";

export const fetchWordpressPosts = async (
  page = 1,
  perPage = 100
): Promise<BlogPost[]> => {
  const PROTOCOL = "https://";
  let response = null;
  try {
    response = await axios.get(
      `${PROTOCOL}${ENDPOINT}${process.env.WORDPRESS_BLOG_ID}/posts?page=${page}&per_page=${perPage}`
    );
  } catch (err) {
    throw new Error(String(err));
  }

  if (!response.data) {
    throw new Error("Failed to load posts");
  }

  const posts: BlogPost[] = response.data.map((p: Record<string, unknown>, index: number) => {
    let processedContent = (p.content as Record<string, string>).rendered.replace(
      /http:\/\//g,
      "https://"
    );

    processedContent = processedContent.replace(
      /src="\/wp-content/g,
      `src=${ENDPOINT}${process.env.WORDPRESS_BLOG_ID}/wp-content`
    );

    const matches = processedContent.match(/<img[^>]+src="([^">]+)"/);
    const firstImageSrc = matches ? matches[1] : null;

    const match = processedContent.match(/<p[^>]*>([^<|&]+)<\/p>/);
    let description = match
      ? match[1].trim()
      : "Curious to learn more about this article? Click below and jump right to it!";

    if (index !== 0) {
      description =
        description.trim().slice(0, 200) +
        (description.trim().length > 200 ? "..." : "");
    }

    const title = (p.title as Record<string, string>).rendered.replace(/&nbsp;/g, " ");
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    return {
      id: p.id,
      url: DOMAKIN_BLOG_URL + (p.id as number) + "/" + slug,
      thumbnail: firstImageSrc,
      title,
    };
  });

  return posts;
};

export const getWordpressPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const posts = await fetchWordpressPosts(1, 100);
    res.json(posts);
  } catch (err) {
    return next(new HttpError((err as Error).message || String(err), 500));
  }
};
