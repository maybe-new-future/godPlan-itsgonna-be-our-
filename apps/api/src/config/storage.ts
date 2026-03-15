import fs from "fs";
import path from "path";

export const BASE_UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  path.join(process.cwd(), "uploads");

export const uploadsRoot = path.resolve(BASE_UPLOAD_DIR);

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getUploadSubdir(subdir: string) {
  const dir = path.join(uploadsRoot, subdir);
  ensureDir(dir);
  return dir;
}

export function resolveManagedUploadPath(fileUrl: string | null | undefined) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return null;
  }

  const relativePath = fileUrl.replace(/^\/uploads\/?/, "").split("/").join(path.sep);
  const absolutePath = path.resolve(uploadsRoot, relativePath);
  const uploadsRootWithSep = `${uploadsRoot}${path.sep}`;

  if (absolutePath.startsWith(uploadsRootWithSep) || absolutePath === uploadsRoot) {
    return absolutePath;
  }

  return null;
}
