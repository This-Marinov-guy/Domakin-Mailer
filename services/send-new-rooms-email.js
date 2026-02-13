import { sendMarketingEmail } from "./email-transporter.js";
import { NEW_ROOMS_FOR_CRITERIA_TEMPLATE } from "../utils/templates.js";
import { fetchOneProperty } from "../controllers/property-controller.js";
import { fetchWordpressPosts } from "../controllers/wordpress-controllers.js";

/**
 * Build template variables for NEW_ROOMS_FOR_CRITERIA_TEMPLATE from one property and all blog posts.
 * Uses receiver to build unsubscribe_link.
 */
export async function buildNewRoomsTemplateVariables(receiver, language = "en") {
  const [property, posts] = await Promise.all([
    fetchOneProperty(language),
    fetchWordpressPosts(1, 100),
  ]);

  const unsubscribeUrl = `${process.env.HOST_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id ?? ""}`;

  const blog_posts = posts.map((p) => ({
    image: p.thumbnail || "",
    title: p.title,
    url: p.url,
  }));

  return {
    room_link: property.room_link,
    room_image_src: property.room_image_src,
    room_title: property.room_title,
    room_rent: property.room_rent,
    room_location: property.room_location,
    room_city: property.room_city,
    room_period: property.room_period,
    room_flatmates: property.room_flatmates,
    blog_posts,
    unsubscribe_link: unsubscribeUrl,
  };
}

/**
 * Send the new-rooms-for-criteria email to a receiver using one property from DB and all WordPress blogs.
 */
export async function sendNewRoomsForCriteriaEmail(receiver, language = "en") {
  const templateVariables = await buildNewRoomsTemplateVariables(receiver, language);
  await sendMarketingEmail(NEW_ROOMS_FOR_CRITERIA_TEMPLATE, receiver, templateVariables);
}
