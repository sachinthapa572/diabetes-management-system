import app from "./app.js";
import { cronService } from "./services/cronService.js";
import appEnv from "./validation/env.js";

// Initialize database and start server
async function startServer() {
  try {
    // Initialize cron jobs
    cronService.init();

    app.listen(appEnv.PORT, () => {
      console.log(`🚀 Server running on port ${appEnv.PORT}`);
      console.log(
        `📊 Health check: http://localhost:${appEnv.PORT}/api/v1/health`
      );
      console.log(
        `🔒 Security: HIPAA-compliant mode ${
          process.env.NODE_ENV === "production" ? "ENABLED" : "DEVELOPMENT"
        }`
      );
      console.log(
        `⏰ Cron jobs initialized: ${Object.keys(
          cronService.getJobsStatus()
        ).join(", ")}`
      );
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully...");
      cronService.stopAll();
      process.exit(0);
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down gracefully...");
      cronService.stopAll();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
