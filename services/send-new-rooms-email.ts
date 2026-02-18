import { sendMarketingEmail } from "./email-transporter.js";
import { NEW_ROOMS_FOR_CRITERIA_TEMPLATE } from "../utils/templates.js";
import { fetchOneProperty, fetchAllPropertiesWithLinkAndStatus2 } from "../controllers/property-controller.js";
import { fetchWordpressPosts } from "../controllers/wordpress-controllers.js";
import { getEmailsByCity } from "../utils/database.js";
import type { EmailReceiver } from "../types/index.js";
import type { RoomEmailData } from "../types/index.js";
import type { BlogPost } from "../types/index.js";

function buildTemplateVariablesForProperty(
  property: RoomEmailData,
  blogPosts: BlogPost[],
  receiver: EmailReceiver
): Record<string, unknown> {
  const unsubscribeUrl = `${process.env.HOST_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id ?? ""}`;
  const blog_posts = (blogPosts || []).slice(0, 3).map((p) => ({
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

export async function buildNewRoomsTemplateVariables(
  receiver: EmailReceiver,
  language = "en"
): Promise<Record<string, unknown>> {
  const [property, posts] = await Promise.all([
    fetchOneProperty(language),
    fetchWordpressPosts(1, 100),
  ]);
  const blogPosts: BlogPost[] = posts.map((p) => ({
    thumbnail: p.thumbnail,
    title: p.title,
    url: p.url,
  }));
  return buildTemplateVariablesForProperty(property, blogPosts, receiver);
}

export async function sendNewRoomsForCriteriaEmail(
  receiver: EmailReceiver,
  language = "en"
): Promise<void> {
  const templateVariables = await buildNewRoomsTemplateVariables(receiver, language);
  await sendMarketingEmail(NEW_ROOMS_FOR_CRITERIA_TEMPLATE, receiver, templateVariables);
}

export interface SendNewRoomsToCitySubscribersResult {
  sent: number;
  errors: { email: string; error: string }[];
}

export async function sendNewRoomsForCriteriaToCitySubscribers(
  limitCity: string | null = null,
  language = "en"
): Promise<SendNewRoomsToCitySubscribersResult> {
  const [properties, blogPostsRaw] = await Promise.all([
    fetchAllPropertiesWithLinkAndStatus2(language),
    fetchWordpressPosts(1, 100),
  ]);
  const blogPosts: BlogPost[] = (blogPostsRaw || []).map((p) => ({
    thumbnail: p.thumbnail,
    title: p.title,
    url: p.url,
  }));

  let sent = 0;
  const errors: { email: string; error: string }[] = [];

  for (const property of properties) {
    const city = property.room_city;
    if (!city || (limitCity && city.toLowerCase() !== limitCity.toLowerCase())) continue;

    const recipients = await getEmailsByCity(city);

    for (const recipient of recipients) {
      const receiver: EmailReceiver = { email: recipient.email, id: String(recipient.id) };
      const templateVariables = buildTemplateVariablesForProperty(property, blogPosts, receiver);

      try {
        await sendMarketingEmail(NEW_ROOMS_FOR_CRITERIA_TEMPLATE, receiver, templateVariables);
        sent += 1;
      } catch (err: unknown) {
        errors.push({
          email: receiver.email,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return { sent, errors };
}
