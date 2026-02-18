import "dotenv/config";
import { runFinishApplicationJob } from "../scheduler/finish-application-job.js";

async function main(): Promise<void> {
  console.log("Running finish application job...");
  const result = await runFinishApplicationJob();
  console.log("Result:", result);
  if (result.errors?.length) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error("Job failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
