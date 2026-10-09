const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

module.exports = function loginRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  res.once("finish", () => {
    if (res.statusCode < 400) attempts.delete(key);
  });
  if (attempts.size > 10000) {
    for (const [address, value] of attempts) if (value.resetAt <= now) attempts.delete(address);
  }
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (current.count >= MAX_ATTEMPTS) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Too many login attempts. Try again later." });
  }
  current.count += 1;
  return next();
};
