import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
dotenv.config();

const client = new MailtrapClient({
  endpoint: process.env.MAILTRAP_HOST,
  token: process.env.MAILTRAP_API_KEY,
});

const sender = {
  email: process.env.MAILTRAP_FROM_ADDRESS ?? "no-reply@domakin.nl",
  name: process.env.MAILTRAP_FROM_NAME ?? "Domakin",
};

/**
 * Send a marketing email via Mailtrap.
 * @param {string} templateId - Mailtrap template UUID
 * @param {{ email: string, id?: string }} receiver - Recipient (id used for unsubscribe_link)
 * @param {object} [templateVariables] - Full template variables. If omitted, only unsubscribe_link is sent.
 */
export const sendMarketingEmail = async (templateId, receiver, templateVariables = null) => {
  const recipients = [{ email: receiver.email }];
  const unsubscribeUrl = `${process.env.HOST_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id ?? ""}`;

  const variables = templateVariables ?? { unsubscribe_link: unsubscribeUrl };

  try {
    await client.send({
      from: sender,
      to: recipients,
      template_uuid: templateId,
      template_variables: {
        ...variables,
        unsubscribe_link: variables.unsubscribe_link ?? unsubscribeUrl,
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
  console.log("Email sent successfully to: " + receiver.email);
};
