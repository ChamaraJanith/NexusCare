import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure 'uploads' directory exists at the root of the doctor-service
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error("Only image files under 10MB are allowed"));
    }
  },
});
