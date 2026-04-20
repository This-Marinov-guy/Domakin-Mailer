import { sendMarketingEmail } from "./email-transporter.js";
import { NEW_ROOMS_FOR_CRITERIA_TEMPLATE } from "../utils/templates.js";
import {
  fetchOneProperty,
  fetchAllPropertiesWithLinkAndStatus2,
  fetchPropertyByIdWithLink,
} from "../controllers/property-controller.js";
import { fetchWordpressPosts } from "../controllers/wordpress-controllers.js";
import { getEmailsByCity } from "../utils/database.js";
import { SUBSCRIBER_EMAILS } from "../utils/emails.js";
import { fetchUnsubscribedEmailSet, isUnsubscribed } from "./unsubscribed-service.js";
import type { EmailReceiver } from "../types/index.js";
import type { RoomEmailData } from "../types/index.js";
import type { BlogPost } from "../types/index.js";

const INTERNAL_CAMPAIGN_RECIPIENT = "info@domakin.nl";

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
  perRoom: { room_link: string; city: string; sent: number }[];
  errors: { email: string; error: string }[];
}

export interface SendNewRoomsForPropertyResult {
  sent: number;
  city: string;
  room_link: string;
  errors: { email: string; error: string }[];
}

export interface SendNewRoomsForPropertyPreviewResult {
  total_recipients: number;
  city: string;
  room_link: string;
  includes_internal_recipient: boolean;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function getRecipientsForPropertyCampaign(
  city: string,
  unsubscribedSet: Set<string>
): Promise<EmailReceiver[]> {
  const recipients = await getEmailsByCity(city);
  const byEmail = new Map<string, EmailReceiver>();

  for (const recipient of recipients) {
    if (!recipient.email || typeof recipient.email !== "string") continue;

    const normalizedEmail = normalizeEmail(recipient.email);
    if (!normalizedEmail) continue;
    if (isUnsubscribed(normalizedEmail, unsubscribedSet)) continue;

    byEmail.set(normalizedEmail, {
      email: recipient.email.trim(),
      id: String(recipient.id),
    });
  }

  if (!byEmail.has(INTERNAL_CAMPAIGN_RECIPIENT)) {
    byEmail.set(INTERNAL_CAMPAIGN_RECIPIENT, {
      email: INTERNAL_CAMPAIGN_RECIPIENT,
      id: "internal-info",
    });
  }

  return Array.from(byEmail.values());
}

export async function sendNewRoomsForCriteriaToCitySubscribers(
  limitCity: string | null = null,
  limitInterface: string | null = null,
  language = "en"
): Promise<SendNewRoomsToCitySubscribersResult> {
  const [properties, blogPostsRaw, unsubscribedSet] = await Promise.all([
    fetchAllPropertiesWithLinkAndStatus2(language),
    fetchWordpressPosts(1, 100),
    fetchUnsubscribedEmailSet(),
  ]);
  const blogPosts: BlogPost[] = (blogPostsRaw || []).map((p) => ({
    thumbnail: p.thumbnail,
    title: p.title,
    url: p.url,
  }));
  let sent = 0;
  const perRoom: { room_link: string; city: string; sent: number }[] = [];
  const errors: { email: string; error: string }[] = [];
  let roomIndex = 0;

  console.log(
    "[NewRooms] Starting sendNewRoomsForCriteriaToCitySubscribers",
    {
      totalProperties: properties.length,
      language,
      limitCity: limitCity ?? "ALL",
      limitInterface: limitInterface ?? "ALL",
    }
  );

  for (const property of properties) {
    roomIndex += 1;
    const city = property.room_city;
    console.log(
      `[NewRooms] [${roomIndex}/${properties.length}] Processing room`,
      {
        room_link: property.room_link,
        city,
      }
    );
    if (!city || (limitCity && city.toLowerCase() !== limitCity.toLowerCase())) {
      console.log("[NewRooms] Skipping room due to city filter or missing city", {
        room_link: property.room_link,
        city,
      });
      continue;
    }

    let roomSent = 0;

    const cityRecipients = await getEmailsByCity(city, limitInterface);
    const subscriberReceivers = SUBSCRIBER_EMAILS.map((email, i) => ({
      email,
      id: String(`subscriber-${i}`),
    }));
    const seenEmails = new Set(
      cityRecipients.map((r: { email: string }) => r.email.toLowerCase())
    );
    const extraFromSubscribers = subscriberReceivers.filter((r: { email: string }) =>
      !seenEmails.has(r.email.toLowerCase())
    );
    const recipients = [
      ...cityRecipients.map((r) => ({ email: r.email, id: String(r.id) })),
      ...extraFromSubscribers,
    ];

    for (const recipient of recipients) {
      if (isUnsubscribed(recipient.email, unsubscribedSet)) continue;

      const receiver: EmailReceiver = { email: recipient.email, id: recipient.id };
      const templateVariables = buildTemplateVariablesForProperty(property, blogPosts, receiver);

      try {
        await sendMarketingEmail(NEW_ROOMS_FOR_CRITERIA_TEMPLATE, receiver, templateVariables);
        sent += 1;
        roomSent += 1;
      } catch (err: unknown) {
        errors.push({
          email: receiver.email,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    perRoom.push({
      room_link: property.room_link,
      city,
      sent: roomSent,
    });

    console.log("[NewRooms] Finished room", {
      room_link: property.room_link,
      city,
      sentForRoom: roomSent,
      totalSentSoFar: sent,
    });
  }

  console.log("[NewRooms] Finished sendNewRoomsForCriteriaToCitySubscribers", {
    totalSent: sent,
    roomsWithEmails: perRoom.length,
    totalProperties: properties.length,
    errorsCount: errors.length,
  });

  return { sent, perRoom, errors };
}

export async function sendNewRoomsForCriteriaForProperty(
  propertyId: string | number,
  language = "en"
): Promise<SendNewRoomsForPropertyResult> {
  const [property, blogPostsRaw, unsubscribedSet] = await Promise.all([
    fetchPropertyByIdWithLink(String(propertyId), language),
    fetchWordpressPosts(1, 100),
    fetchUnsubscribedEmailSet(),
  ]);

  if (!property.room_city) {
    throw new Error("Property city is missing");
  }

  if (!property.room_link) {
    throw new Error("Property link is missing");
  }

  const blogPosts: BlogPost[] = (blogPostsRaw || []).map((p) => ({
    thumbnail: p.thumbnail,
    title: p.title,
    url: p.url,
  }));

  const recipients = await getRecipientsForPropertyCampaign(property.room_city, unsubscribedSet);

  let sent = 0;
  const errors: { email: string; error: string }[] = [];

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

  return {
    sent,
    city: property.room_city,
    room_link: property.room_link,
    errors,
  };
}

export async function previewNewRoomsForCriteriaForProperty(
  propertyId: string | number,
  language = "en"
): Promise<SendNewRoomsForPropertyPreviewResult> {
  const [property, unsubscribedSet] = await Promise.all([
    fetchPropertyByIdWithLink(String(propertyId), language),
    fetchUnsubscribedEmailSet(),
  ]);

  if (!property.room_city) {
    throw new Error("Property city is missing");
  }

  if (!property.room_link) {
    throw new Error("Property link is missing");
  }

  const recipients = await getRecipientsForPropertyCampaign(property.room_city, unsubscribedSet);

  return {
    total_recipients: recipients.length,
    city: property.room_city,
    room_link: property.room_link,
    includes_internal_recipient: true,
  };
}
