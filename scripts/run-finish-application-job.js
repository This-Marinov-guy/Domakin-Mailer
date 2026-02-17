import "dotenv/config";
import { runFinishApplicationJob } from "../scheduler/finish-application-job.js";

/**
 * Run the finish application job once (applications created exactly 2 days ago, NL date).
 * Cron runs it automatically every day at 9:00 NL time.
 */
async function main() {
  console.log("Running finish application job...");
  const result = await runFinishApplicationJob();
  console.log("Result:", result);
  if (result.errors?.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Job failed:", err.message);
  process.exit(1);
});
