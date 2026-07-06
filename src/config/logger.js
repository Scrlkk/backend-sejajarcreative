import winston from "winston";
import path from "path";
import fs from "fs";

import DailyRotateFile from "winston-daily-rotate-file";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, "error-%DATE%.log"),
  datePattern: "YYYY-[W]WW", // Rotate weekly
  zippedArchive: true,      // Compress the rotated logs
  maxSize: "20m",
  maxFiles: "12",           // Keep logs for 12 weeks (3 months)
  level: "error",
});

const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, "combined-%DATE%.log"),
  datePattern: "YYYY-[W]WW", // Rotate weekly
  zippedArchive: true,      // Compress the rotated logs
  maxSize: "20m",
  maxFiles: "12",           // Keep logs for 12 weeks
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "express-sejajar" },
  transports: [errorRotateTransport, combinedRotateTransport],
});


if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...rest }) =>
            `${timestamp} [${level}]: ${message} ${
              Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ""
            }`,
        ),
      ),
    }),
  );
}

export default logger;
