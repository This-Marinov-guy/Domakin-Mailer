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

export const sendMarketingEmail = async (templateId, receiver) => {
  const recipients = [
    {
      email: receiver.email,
    },
  ];

  const unsubscribeUrl = `${process.env.HOST_URL}/callback/newsletter/unsubscribe?email=${receiver.email}&id=${receiver.id}`;

  try {
    await client.send({
      from: sender,
      to: recipients,
      template_uuid: templateId,
      template_variables: {
        unsubscribe_link: unsubscribeUrl,
      },
    });
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Email sent successfully to: " + receiver.email);
  }
};
