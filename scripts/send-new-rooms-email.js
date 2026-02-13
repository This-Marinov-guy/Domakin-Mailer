import "dotenv/config";
import { sendNewRoomsForCriteriaEmail } from "../services/send-new-rooms-email.js";

const TO = "vladislavmarinov3142@gmail.com";

const receiver = {
  email: TO,
  id: "test-new-rooms",
};

async function main() {
  console.log("Fetching one property and all blogs, then sending New Rooms email to", TO, "...");
  await sendNewRoomsForCriteriaEmail(receiver);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
