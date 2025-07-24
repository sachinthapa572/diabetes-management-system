import type { ScheduledTask } from "node-cron";
import cron from "node-cron";
import { weeklyReportService } from "./weeklyReportService";

class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  init(): void {
    console.log("Initializing cron jobs...");

    // Schedule weekly report generation
    this.scheduleWeeklyReports();

    console.log("Cron jobs initialized successfully");
  }

  private scheduleWeeklyReports(): void {
    // Run every Monday at 9:00 AM
    // Cron format: second minute hour day month dayOfWeek
    // 0 0 9 * * 1 = Every Monday at 9:00 AM
    const weeklyReportJob = cron.schedule("0 0 9 * * 1", async () => {
      console.log("Starting weekly report cron job...");
      try {
        await weeklyReportService.generateAndSendWeeklyReports();
        console.log("Weekly report cron job completed successfully");
      } catch (error) {
        console.error("Weekly report cron job failed:", error);
      }
    });

    this.jobs.set("weeklyReports", weeklyReportJob);
    console.log("Weekly report job scheduled for every Monday at 9:00 AM");
  }

  // Manual trigger for testing
  async triggerWeeklyReports(): Promise<void> {
    console.log("Manually triggering weekly reports...");
    try {
      await weeklyReportService.generateAndSendWeeklyReports();
      console.log("Manual weekly report trigger completed successfully");
    } catch (error) {
      console.error("Manual weekly report trigger failed:", error);
      throw error;
    }
  }

  // Stop all cron jobs
  stopAll(): void {
    console.log("Stopping all cron jobs...");
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  // Get status of all jobs
  getJobsStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((job, name) => {
      status[name] = job.getStatus() === "running";
    });
    return status;
  }

  // Restart a specific job
  restartJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      console.log(`Restarted cron job: ${jobName}`);
      return true;
    }
    console.error(`Cron job not found: ${jobName}`);
    return false;
  }
}

export const cronService = new CronService();
