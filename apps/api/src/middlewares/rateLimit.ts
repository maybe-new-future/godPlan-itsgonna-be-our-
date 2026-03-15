import rateLimit from "express-rate-limit";

function createJsonRateLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      return res.status(429).json({ message });
    },
  });
}

export const authRateLimiter = createJsonRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many authentication attempts. Please try again later."
);

export const applyRateLimiter = createJsonRateLimiter(
  15 * 60 * 1000,
  20,
  "Too many job applications. Please try again later."
);

export const messageRateLimiter = createJsonRateLimiter(
  5 * 60 * 1000,
  30,
  "Too many messages sent. Please try again later."
);
