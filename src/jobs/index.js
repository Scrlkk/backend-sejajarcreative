import { start as startContentSchedule } from "./contentSchedule.job.js";

export const startAllJobs = () => {
  startContentSchedule();
};
