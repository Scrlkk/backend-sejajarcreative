import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file types
const ALLOWED_MIMES = [
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain", // .txt
  // Video
  "video/mp4",
  "video/mpeg",
  "video/quicktime", // .mov
  "video/webm",
];

const ALLOWED_EXTS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".mp4",
  ".mpeg",
  ".mov",
  ".webm",
];

const MAX_FILE_SIZE =
  parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 80);
    const uniqueSuffix = Date.now();
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Tipe file tidak diizinkan. Hanya: ${ALLOWED_EXTS.join(", ")}`),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export { upload, UPLOAD_DIR, ALLOWED_EXTS, MAX_FILE_SIZE };
