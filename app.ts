import express from "express";
import cors from "cors";
import cron from "node-cron";
import { readFileSync } from "fs";
import { join } from "path";
import swaggerUi from "swagger-ui-express";
import { allowedOrigins } from "./utils/access.js";
import { firewall, rateLimiter } from "./middleware/firewall.js";
import { axiomLogging } from "./middleware/axiom-logging.js";
import { logScheduler } from "./utils/axiom-logger.js";
import dotenv from "dotenv";
import listingRoutes from "./routes/listing-routes.js";
import roomRoutes from "./routes/room-routes.js";
import reminderRoutes from "./routes/reminder-routes.js";
import HttpError from "./models/Http-error.js";
import { runEmailRemindersJob } from "./scheduler/email-reminders-job.js";
import { runFinishApplicationJob } from "./scheduler/finish-application-job.js";
dotenv.config();

const openapiPath = join(process.cwd(), "openapi", "openapi.json");
const swaggerDocument = JSON.parse(readFileSync(openapiPath, "utf-8")) as Record<string, unknown>;

const app = express();

const PORT = Number(process.env.PORT) || 8080;

app.set("trust proxy", true);

if (app.get("env") !== "development") {
  app.use(rateLimiter);
  app.use(firewall);
} else {
  allowedOrigins.push("http://localhost:3000");
}

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new HttpError(
            "There was a problem with your request, please try again later!",
            403
          )
        );
      }
    },
  })
);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(axiomLogging);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const cronJobs = [
  {
    name: "email_reminders",
    schedule: "0 9 * * *",
    timezone: "Europe/Amsterdam",
    description: "Process email_reminders: send pending/failed reminders whose scheduled_date is today or in the past.",
  },
  {
    name: "finish_application",
    schedule: "0 9 * * *",
    timezone: "Europe/Amsterdam",
    description: "Send finish-listing emails to listing_applications created exactly 2 days ago (NL date).",
  },
];

app.get("/api/scheduler", (req, res) => {
  res.json({ jobs: cronJobs });
});

app.use("/api/listing", listingRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/reminder", reminderRoutes);

app.use((err: HttpError & { code?: number }, req: express.Request, res: express.Response) => {
  const code = err.code && Number.isInteger(err.code) ? err.code : 500;
  res.status(code).json({ ok: false, message: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Cron] Email reminders job failed:", message);
      logScheduler({
        jobName,
        request: { jobName, schedule: "0 9 * * *", timezone: "Europe/Amsterdam" },
        response: { ok: false, durationMs, error: message },
        analytics: { durationMs, error: message },
      });
    }
  },
  { timezone: "Europe/Amsterdam" }
);

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
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Cron] Finish application job failed:", message);
      logScheduler({
        jobName,
        request: { jobName, schedule: "0 9 * * *", timezone: "Europe/Amsterdam" },
        response: { ok: false, durationMs, error: message },
        analytics: { durationMs, error: message },
      });
    }
  },
  { timezone: "Europe/Amsterdam" }
);

// async function App(): Promise<void> {
//   // sendNewRoomsForCriteriaToCitySubscribers("leeuwarden");
// }

// App();
