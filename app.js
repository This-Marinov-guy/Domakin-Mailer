import express from "express";
import cors from "cors";
import cron from "node-cron";
import { allowedOrigins } from "./utils/access.js";
import { firewall, rateLimiter } from "./middleware/firewall.js";
import { axiomLogging } from "./middleware/axiom-logging.js";
import { logScheduler } from "./utils/axiom-logger.js";
import dotenv from "dotenv";
import { getEmailsByCity, subscribedNewsletterClients } from "./utils/database.js";
import { sendMarketingEmail } from "./services/email-transporter.js";
import { DOMAKIN_LIST_ROOM_EN } from "./utils/templates.js";
import { fetchOneProperty } from "./controllers/property-controller.js";
import { sendNewRoomsForCriteriaEmail, sendNewRoomsForCriteriaToCitySubscribers } from "./services/send-new-rooms-email.js";
import { runEmailRemindersJob } from "./scheduler/email-reminders-job.js";
import { runFinishApplicationJob } from "./scheduler/finish-application-job.js";
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

app.use(axiomLogging);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Cron: every day at 9:00 NL time – process email_reminders (pending/failed, date = today or past)
cron.schedule(
  "0 9 * * *",
  async () => {
    const jobName = "email_reminders";
    console.log("[Cron] Running email reminders job at 9:00 NL...");
    const start = Date.now();
    try {
      const result = await runEmailRemindersJob();
      const durationMs = Date.now() - start;
      console.log("[Cron] Email reminders:", result);
      if (result.errors?.length) console.error("[Cron] Errors:", result.errors);
      logScheduler({
        jobName,
        request: { jobName, schedule: "0 9 * * *", timezone: "Europe/Amsterdam" },
        response: { ok: true, durationMs },
        analytics: {
          processed: result.processed,
          completed: result.completed,
          failed: result.failed,
          errorsCount: result.errors?.length ?? 0,
          durationMs,
        },
      });
    } catch (err) {
      const durationMs = Date.now() - start;
      console.error("[Cron] Email reminders job failed:", err?.message || err);
      logScheduler({
        jobName,
        request: { jobName, schedule: "0 9 * * *", timezone: "Europe/Amsterdam" },
        response: { ok: false, durationMs, error: err?.message || String(err) },
        analytics: { durationMs, error: err?.message || String(err) },
      });
    }
  },
  { timezone: "Europe/Amsterdam" }
);

// Cron: every day at 9:00 NL time – send finish_listing to listing_applications created exactly 2 days ago
cron.schedule(
  "0 9 * * *",
  async () => {
    const jobName = "finish_application";
    console.log("[Cron] Running finish application job at 9:00 NL...");
    const start = Date.now();
    try {
      const result = await runFinishApplicationJob();
      const durationMs = Date.now() - start;
      console.log("[Cron] Finish application:", result);
      if (result.errors?.length) console.error("[Cron] Errors:", result.errors);
      logScheduler({
        jobName,
        request: { jobName, schedule: "0 9 * * *", timezone: "Europe/Amsterdam" },
        response: { ok: true, durationMs },
        analytics: {
          processed: result.processed,
          sent: result.sent,
          errorsCount: result.errors?.length ?? 0,
          durationMs,
        },
      });
    } catch (err) {
      const durationMs = Date.now() - start;
      console.error("[Cron] Finish application job failed:", err?.message || err);
      logScheduler({
        jobName,
        request: { jobName, schedule: "0 9 * * *", timezone: "Europe/Amsterdam" },
        response: { ok: false, durationMs, error: err?.message || String(err) },
        analytics: { durationMs, error: err?.message || String(err) },
      });
    }
  },
  { timezone: "Europe/Amsterdam" }
);

// Background Task
async function App() {
  // sendNewRoomsForCriteriaToCitySubscribers("leeuwarden");
}

App();
