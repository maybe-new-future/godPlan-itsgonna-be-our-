import path from "path";
import multer from "multer";
import { Request } from "express";
import { getUploadSubdir } from "../config/storage";

function createImageUpload(subdir: string, fieldName: string) {
  const uploadDir = getUploadSubdir(subdir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, name);
    },
  });

  function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },
  }).single(fieldName);
}

export const uploadAvatar = createImageUpload("avatars", "avatar");
export const uploadCompanyLogo = createImageUpload("logos", "logo");
