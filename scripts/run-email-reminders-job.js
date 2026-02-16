import "dotenv/config";
import { runEmailRemindersJob } from "../scheduler/email-reminders-job.js";

/**
 * Run the email reminders job once (e.g. for testing or manual trigger).
 * Cron runs it automatically every day at 9:00 NL time.
 */
async function main() {
  console.log("Running email reminders job...");
  const result = await runEmailRemindersJob();
  console.log("Result:", result);
  if (result.errors?.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Job failed:", err.message);
  process.exit(1);
});
