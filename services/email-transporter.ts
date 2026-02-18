import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
import type { EmailReceiver } from "../types/index.js";

dotenv.config();

const client = new MailtrapClient({
  token: (process.env.MAILTRAP_API_KEY as string) ?? "",
});

const sender = {
  email: process.env.MAILTRAP_FROM_ADDRESS ?? "no-reply@domakin.nl",
  name: process.env.MAILTRAP_FROM_NAME ?? "Domakin",
};

export const sendMarketingEmail = async (
  templateId: string,
  receiver: EmailReceiver,
  templateVariables: Record<string, unknown> | null = null
): Promise<void> => {
  const recipients = [{ email: receiver.email }];
  const unsubscribeUrl = `${process.env.HOST_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id ?? ""}`;

  const variables = templateVariables ?? { unsubscribe_link: unsubscribeUrl };

  const templateVars: Record<string, string | number | boolean> = {
    ...(variables as Record<string, string | number | boolean>),
    unsubscribe_link: (variables.unsubscribe_link as string) ?? unsubscribeUrl,
  };

  try {
    await client.send({
      from: sender,
      to: recipients,
      template_uuid: templateId,
      template_variables: templateVars,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
  console.log("Email sent successfully to: " + receiver.email);
};
