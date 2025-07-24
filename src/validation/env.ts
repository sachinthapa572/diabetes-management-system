// check if the env variables are set correctly else throw an error
type Env = {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
};

const appEnv: Env = {
  PORT: Bun.env.PORT!,
  DATABASE_URL: Bun.env.DATABASE_URL!,
  NODE_ENV: Bun.env.NODE_ENV!,
  JWT_SECRET: Bun.env.JWT_SECRET!,
  JWT_EXPIRES_IN: Bun.env.JWT_EXPIRES_IN!,
  REFRESH_TOKEN_SECRET: Bun.env.REFRESH_TOKEN_SECRET!,
  REFRESH_TOKEN_EXPIRES_IN: Bun.env.REFRESH_TOKEN_EXPIRES_IN!,
  SMTP_HOST: Bun.env.SMTP_HOST,
  SMTP_PORT: Bun.env.SMTP_PORT,
  SMTP_USER: Bun.env.SMTP_USER,
  SMTP_PASS: Bun.env.SMTP_PASS,
};

// Check if all required env variables are defined
Object.entries(appEnv).forEach(([key, value]) => {
  if (typeof value === "undefined") {
    console.log(`Environment variable ${key} is not set.`);
  }
});

export default appEnv;
