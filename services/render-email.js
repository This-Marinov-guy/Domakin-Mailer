import Handlebars from "handlebars";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { BACKGROUNDS, LOGOS, ICONS, SOCIAL_ICONS } from "../utils/images.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, "..", "templates");

/**
 * Renders an HTML email template with the given context (Handlebars).
 * Use with nodemailer: transport.sendMail({ html: await renderEmailTemplate('departure-list-your-room', context), ... })
 *
 * @param {string} templateName - Name without .html (e.g. 'departure-list-your-room', 'new-rooms-for-criteria', 'finish-your-listing')
 * @param {object} context - Data to inject. Must include base_url (and optionally hero_background_url, logo_url, etc.)
 * @returns {Promise<string>} Rendered HTML
 */
export async function renderEmailTemplate(templateName, context) {
  const path = join(TEMPLATES_DIR, `${templateName}.html`);
  const source = await readFile(path, "utf-8");
  const template = Handlebars.compile(source);
  return template(context);
}

/**
 * Builds default template variables using asset URLs from utils/images.js (Cloudinary, etc.).
 * Pass baseUrl only if you need it for links; image URLs come from images.js. Override any key as needed.
 *
 * @param {string} [baseUrl] - Optional base URL for links (no trailing slash)
 * @param {object} overrides - Override or add any template variables (e.g. hero_background_url: BACKGROUNDS[2], logo_url: LOGOS.rentswap)
 * @returns {object} Context object for Handlebars
 */
export function defaultTemplateContext(baseUrl = "", overrides = {}) {
  const base = (baseUrl || "").replace(/\/$/, "");
  return {
    base_url: base,
    hero_background_url: BACKGROUNDS[1],
    logo_url: LOGOS.domakin,
    home_url: "https://www.domakin.nl",
    contact_url: "https://www.domakin.nl/contact",
    linkedin_icon_url: SOCIAL_ICONS.linkedin,
    instagram_icon_url: SOCIAL_ICONS.instagram,
    facebook_icon_url: SOCIAL_ICONS.facebook,
    icon_documents_url: ICONS.documents,
    icon_user_url: ICONS.user,
    icon_house_url: ICONS.house,
    icon_cash_url: ICONS.cash,
    icon_location_url: ICONS.location,
    icon_calendar_url: ICONS.calendar,
    icon_box_url: ICONS.box,
    icon_payment_url: ICONS.payment,
    unsubscribe_text: "Changed your mind? You can",
    unsubscribe_link_text: "unsubscribe at any time.",
    ...overrides,
  };
}

/**
 * Sends an email using nodemailer with a rendered HTML template.
 * Expects env: GMAIL_HOST, GMAIL_PORT, GMAIL_USERNAME, GMAIL_PASSWORD, GMAIL_FROM_ADDRESS, GMAIL_FROM_NAME (or NODE_MAILER_*).
 *
 * @param {object} options - { to, subject, templateName, context, text? }
 * @param {object} [transport] - Optional nodemailer transport (created from env if not provided)
 * @returns {Promise<object>} Result from transport.sendMail
 */
export async function sendTemplatedEmail(options, transport = null) {
  const nodemailer = (await import("nodemailer")).default;
  const { to, subject, templateName, context, text } = options;
  const html = await renderEmailTemplate(templateName, context);
  const transporter =
    transport ||
    nodemailer.createTransport({
      host: process.env.GMAIL_HOST || process.env.NODE_MAILER_HOST,
      port: Number(process.env.GMAIL_PORT || process.env.NODE_MAILER_PORT || 587),
      secure: false,
      auth: {
        user: process.env.GMAIL_USERNAME || process.env.NODE_MAILER_USER,
        pass: process.env.GMAIL_PASSWORD || process.env.NODE_MAILER_PASS,
      },
    });
  const fromAddress = process.env.GMAIL_FROM_ADDRESS || process.env.NODE_MAILER_FROM || "no-reply@domakin.nl";
  const fromName = process.env.GMAIL_FROM_NAME || process.env.NODE_MAILER_FROM_NAME || "Domakin";
  return transporter.sendMail({
    from: fromName ? `"${fromName}" <${fromAddress}>` : fromAddress,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text: text || undefined,
  });
}