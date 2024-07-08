import { CronJob } from "cron";
import db from "../db/init";

export const clearStalePINs = new CronJob(
  "0 */6 * * *", // cronTime
  function () {
    db.prepare(
      `
      DELETE FROM game
      WHERE active < 2
      AND created_at <= datetime('now', '-1 hour')`
    ).run();
  },
  null,
  false,
  "Etc/UTC"
);
