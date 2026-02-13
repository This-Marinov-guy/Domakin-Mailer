import "dotenv/config";
import { sendTemplatedEmail, defaultTemplateContext } from "../services/render-email.js";

const TO = "vladislavmarinov3142@gmail.com";

// Mock data for template dde7e699-3412-4b7c-b3ce-3518050b71f5 (new-rooms-for-criteria)
const mockData = {
  room_link: "Test_Room_link",
  room_image_src: "Test_Room_image_src",
  room_title: "Test_Room_title",
  room_rent: "Test_Room_rent",
  room_location: "Test_Room_location",
  room_city: "Test_Room_city",
  room_period: "Test_Room_period",
  room_flatmates: "Test_Room_flatmates",
  blog_posts: [
    {
      image: "Test_Blog_posts_Image",
      title: "Test_Blog_posts_Title",
      url: "Test_Blog_posts_Url",
    },
  ],
  unsubscribe_link: "Test_Unsubscribe_link",
};

async function main() {
  console.log("Sending test email to", TO, "...");

  const shared = defaultTemplateContext(process.env.HOST_URL || "https://domakin.nl");
  const context = {
    ...shared,
    hero_title: "New listing alert!",
    hero_subtitle: "Explore the latest available rooms and apply to secure your place in the Netherlands.",
    new_ribbon_text: "NEW",
    match_label: "match",
    rooms: [
      {
        image: mockData.room_image_src,
        title: mockData.room_title,
        rent: mockData.room_rent,
        location: mockData.room_location,
        city: mockData.room_city,
        period: mockData.room_period,
        flatmates: mockData.room_flatmates,
        url: mockData.room_link,
      },
    ],
    view_all_rooms_url: "https://www.domakin.nl/services/renting",
    cta_button_text: "Browse all available properties",
    blog_posts: mockData.blog_posts,
    unsubscribe_link: mockData.unsubscribe_link,
  };

  const result = await sendTemplatedEmail({
    to: TO,
    subject: "[Test] Domakin – New rooms (template dde7e699-3412-4b7c-b3ce-3518050b71f5)",
    templateName: "new-rooms-for-criteria",
    context,
  });

  console.log("Sent successfully:", result.messageId);
}

main().catch((err) => {
  console.error("Failed to send test email:", err.message);
  process.exit(1);
});
