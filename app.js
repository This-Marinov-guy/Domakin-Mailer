import express from "express";
import cors from "cors";
import cron from "node-cron";
import { allowedOrigins } from "./utils/access.js";
import { firewall, rateLimiter } from "./middleware/firewall.js";
import dotenv from "dotenv";
import { getEmailsByCity, subscribedNewsletterClients } from "./utils/database.js";
import { sendMarketingEmail } from "./services/email-transporter.js";
import { DOMAKIN_LIST_ROOM_EN } from "./utils/templates.js";
import { fetchOneProperty } from "./controllers/property-controller.js";
import { sendNewRoomsForCriteriaEmail, sendNewRoomsForCriteriaToCitySubscribers } from "./services/send-new-rooms-email.js";
import { runEmailRemindersJob } from "./scheduler/email-reminders-job.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 80; // Default to 80 if PORT is not set

// Firewall
app.set("trust proxy", true);

if (app.get("env") !== "development") {
  app.use(rateLimiter);
  app.use(firewall);
} else {
  allowedOrigins.push("http://localhost:3000");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new HttpError(
            "There was a problem with your request, please try again later!",
            403,
          ),
        );
      }
    },
  }),
);

app.use((req, res, next) => {
  if ("OPTIONS" == req.method) {
    return res.sendStatus(200);
  } else {
    next();
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Cron: every day at 9:00 NL time – process email_reminders (pending/failed, date = today)
cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("[Cron] Running email reminders job at 9:00 NL...");
    try {
      const result = await runEmailRemindersJob();
      console.log("[Cron] Email reminders:", result);
      if (result.errors?.length) console.error("[Cron] Errors:", result.errors);
    } catch (err) {
      console.error("[Cron] Email reminders job failed:", err?.message || err);
    }
  },
  { timezone: "Europe/Amsterdam" }
);

// Background Task
async function App() {
  // sendNewRoomsForCriteriaToCitySubscribers("leeuwarden");
}

App();
