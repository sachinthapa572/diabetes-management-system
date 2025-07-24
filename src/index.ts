import app from "./app.js";
import appEnv from "./validation/env.js";



// Initialize database and start server
async function startServer() {
  try {
    app.listen(appEnv.PORT, () => {
      console.log(`🚀 Server running on port ${appEnv.PORT}`);
      console.log(`📊 Health check: http://localhost:${appEnv.PORT}/api/v1/health`);
      console.log(
        `🔒 Security: HIPAA-compliant mode ${
          process.env.NODE_ENV === "production" ? "ENABLED" : "DEVELOPMENT"
        }`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();