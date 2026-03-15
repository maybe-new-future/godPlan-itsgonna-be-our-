import fs from "fs";
import path from "path";

const configuredUploadDir = process.env.UPLOAD_DIR?.trim();
const fallbackUploadDir = process.env.RENDER ? "/opt/render/project/src/uploads" : "./uploads";

export const uploadsRoot = path.resolve(configuredUploadDir || fallbackUploadDir);

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
