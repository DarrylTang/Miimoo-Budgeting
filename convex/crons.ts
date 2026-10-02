import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Automatically check and apply any due recurring rules every hour
crons.interval(
  "apply-due-recurring-rules",
  { minutes: 60 },
  api.recurring.applyDueRules,
);

export default crons;
