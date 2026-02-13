import { sendMarketingEmail } from "./email-transporter.js";
import { NEW_ROOMS_FOR_CRITERIA_TEMPLATE } from "../utils/templates.js";
import { fetchOneProperty, fetchAllPropertiesWithLinkAndStatus2 } from "../controllers/property-controller.js";
import { fetchWordpressPosts } from "../controllers/wordpress-controllers.js";
import { getEmailsByCity } from "../utils/database.js";

/**
 * Build template variables for NEW_ROOMS_FOR_CRITERIA_TEMPLATE from one property, blog posts, and receiver.
 */
function buildTemplateVariablesForProperty(property, blogPosts, receiver) {
  const unsubscribeUrl = `${process.env.HOST_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id ?? ""}`;
  const blog_posts = (blogPosts || [])
    .map((p) => ({
      image: p.thumbnail || "",
      title: p.title,
      url: p.url,
    }))
    .slice(0, 3);
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
 * Build template variables for NEW_ROOMS_FOR_CRITERIA_TEMPLATE from one property and all blog posts.
 * Uses receiver to build unsubscribe_link.
 */
export async function buildNewRoomsTemplateVariables(receiver, language = "en") {
  const [property, posts] = await Promise.all([
    fetchOneProperty(language),
    fetchWordpressPosts(1, 100),
  ]);
  const blogPosts = posts.map((p) => ({ thumbnail: p.thumbnail, title: p.title, url: p.url }));
  return buildTemplateVariablesForProperty(property, blogPosts, receiver);
}

/**
 * Send the new-rooms-for-criteria email to a receiver using one property from DB and all WordPress blogs.
 */
export async function sendNewRoomsForCriteriaEmail(receiver, language = "en") {
  const templateVariables = await buildNewRoomsTemplateVariables(receiver, language);
  await sendMarketingEmail(NEW_ROOMS_FOR_CRITERIA_TEMPLATE, receiver, templateVariables);
}

/**
 * For each property with link and status = 2: take property_data.city, collect all emails from
 * newsletters and search_renting that have that city, and send NEW_ROOMS_FOR_CRITERIA_TEMPLATE
 * via Mailtrap with room_*, blog_posts, and unsubscribe_link per recipient.
 * @param {string} [language="en"]
 * @returns {{ sent: number, errors: { email: string, error: string }[] }}
 */
export async function sendNewRoomsForCriteriaToCitySubscribers(language = "en") {
  const [properties, blogPostsRaw] = await Promise.all([
    fetchAllPropertiesWithLinkAndStatus2(language),
    fetchWordpressPosts(1, 100),
  ]);
  const blogPosts = (blogPostsRaw || []).map((p) => ({
    thumbnail: p.thumbnail,
    title: p.title,
    url: p.url,
  }));

  let sent = 0;
  const errors = [];

  for (const property of properties) {
    const city = property.room_city;
    if (!city) continue;

    const recipients = await getEmailsByCity(city);

    for (const recipient of recipients) {
      const receiver = { email: recipient.email, id: recipient.id };
      const templateVariables = buildTemplateVariablesForProperty(property, blogPosts, receiver);
      
      try { 
        await sendMarketingEmail(NEW_ROOMS_FOR_CRITERIA_TEMPLATE, receiver, templateVariables);
        sent += 1;
      } catch (err) {
        errors.push({ email: receiver.email, error: err?.message || String(err) });
      }
    } 
  }

  return { sent, errors };
}
