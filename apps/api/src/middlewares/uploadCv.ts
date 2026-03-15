import path from "path";
import multer from "multer";
import { Request } from "express";
import { getUploadSubdir } from "../config/storage";

const cvDir = getUploadSubdir("cv");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cvDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = "application/pdf";
  if (file.mimetype === allowed) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
}

export const uploadCv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("cv");
