import HttpError from "../models/Http-error.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const ENDPOINT = "public-api.wordpress.com/wp/v2/sites/";
const DOMAKIN_BLOG_URL = "https://www.domakin.nl/blog/";

export const fetchWordpressPosts = async (page = 1, perPage = 100) => {
  const PROTOCOL = "https://";
  let response = null;
  try {
    response = await axios.get(
      `${PROTOCOL}${ENDPOINT}${process.env.WORDPRESS_BLOG_ID}/posts?page=${page}&per_page=${perPage}`
    );
  } catch (err) {
    throw new Error(err);
  }

  if (!response.data) {
    throw new Error("Failed to load posts");
  }

  const posts = response.data.map((p, index) => {
    // Replace http with https
    let processedContent = p.content.rendered.replace(/http:\/\//g, "https://");

    // Fix relative image paths
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

    const title = p.title.rendered.replace(/&nbsp;/g, " ");
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove punctuation
      .trim()
      .replace(/\s+/g, "-");

    return {
      id: p.id,
      url: DOMAKIN_BLOG_URL + p.id + "/" + slug,
      thumbnail: firstImageSrc,
      title: title,
    };
  });

  return posts;
};

export const getWordpressPosts = async (req, res, next) => {
  const page = 1;
  const perPage = 100;
  try {
    const posts = await fetchWordpressPosts(page, perPage);
    res.json(posts);
  } catch (err) {
    return next(new HttpError(err.message || err, 500));
  }
};
