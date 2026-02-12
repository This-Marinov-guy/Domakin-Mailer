import "dotenv/config";
import { sendTemplatedEmail } from "../services/render-email.js";
import {
  departureListYourRoomData,
  newRoomsForCriteriaData,
  finishYourListingData,
} from "../utils/email-template-data-examples.js";

const TO = "info@domakin.nl";

const mockReceiver = {
  email: TO,
  name: "Domakin Team",
  id: "test-123",
};

async function main() {
  console.log("Sending test email to", TO, "...");

  const context = departureListYourRoomData(mockReceiver, {
    departure_date: "15 March 2025",
    room_address: "Keizersgracht 100",
    room_city: "Amsterdam",
    days_left: 7,
    list_room_url: "https://www.domakin.nl/list-room?ref=test",
  });

  const result = await sendTemplatedEmail({
    to: TO,
    subject: "[Test] Domakin – List your room (mock data)",
    templateName: "departure-list-your-room",
    context,
  });

  console.log("Sent successfully:", result.messageId);
}

main().catch((err) => {
  console.error("Failed to send test email:", err.message);
  process.exit(1);
});
