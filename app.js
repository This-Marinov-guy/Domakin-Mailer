import express from "express";
import { subscribedNewsletterClients } from "./utils/database.js";

import dotenv from "dotenv";
import { DOMAKIN_HISTORY_TEMPLATE, DOMAKIN_IMPACT_CHALLENGE, DOMAKIN_LIST_ROOM_BG, DOMAKIN_LIST_ROOM_EN } from "./utils/templates.js";
import { sendMarketingEmail } from "./services/email-transporter.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Background Task
async function App() {
  const clients = await subscribedNewsletterClients();
  for (const client of clients) {
    // await sendMarketingEmail(DOMAKIN_LIST_ROOM_BG, client);
  }

  console.log(`Emails sent successfully to all ${clients.length} clients.`);
  
}

App();
