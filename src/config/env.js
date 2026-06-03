import "dotenv/config";

const required = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CORS_ORIGIN",
];

required.forEach((key) => {
  if (process.env[key] === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Validate CORS_ORIGIN is not "*"
if (process.env.CORS_ORIGIN === "*") {
  throw new Error(
    "CORS_ORIGIN cannot be '*' for security reasons. Please specify allowed origins.",
  );
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3000,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || "db_sejajar",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  // Enforce minimum bcrypt rounds (minimum 12)
  bcryptRounds: Math.max(parseInt(process.env.BCRYPT_ROUNDS, 10) || 12, 12),
  cors: {
    origins: process.env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  },
  logLevel: process.env.LOG_LEVEL || "info",
};

export default env;
