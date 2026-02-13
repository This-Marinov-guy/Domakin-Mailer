import "dotenv/config";
import { sendNewRoomsForCriteriaToCitySubscribers } from "../services/send-new-rooms-email.js";

const language = process.env.LANGUAGE || "en";

async function main() {
  console.log("Fetching properties (link + status=2), collecting emails by city, sending New Rooms template...");
  const { sent, errors } = await sendNewRoomsForCriteriaToCitySubscribers(language);
  console.log("Sent:", sent);
  if (errors.length) console.error("Errors:", errors);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
