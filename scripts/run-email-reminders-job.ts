import "dotenv/config";
import { runEmailRemindersJob } from "../scheduler/email-reminders-job.js";

async function main(): Promise<void> {
  console.log("Running email reminders job...");
  const result = await runEmailRemindersJob();
  console.log("Result:", result);
  if (result.errors?.length) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error("Job failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
