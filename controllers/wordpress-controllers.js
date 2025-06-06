import HttpError from "../../models/Http-error.js";
import axios from "axios";
import dotenv from "dotenv";
import { PROTOCOL } from "../../util/config/access.js";
dotenv.config();

const ENDPOINT = "public-api.wordpress.com/wp/v2/sites/";

export const getWordpressPosts = async (req, res, next) => {
  let response = null;
  const page = 1;
  const perPage = 100;

  try {
    // TODO: paginate
    response = await axios.get(
      `${PROTOCOL}${ENDPOINT}${process.env.WORDPRESS_BLOG_ID}/posts?page=${page}&per_page=${perPage}`
    );
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  if (!response.data) {
    return next(new HttpError("Failed to load posts", 500));
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

    return {
      id: p.id,
      thumbnail: firstImageSrc,
      title: p.title.rendered.replace(/&nbsp;/g, " "),
      description: description,
    };
  });

  return posts;
};
