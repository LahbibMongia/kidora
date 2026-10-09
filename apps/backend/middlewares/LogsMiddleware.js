// Deliberately log metadata only. Request headers and bodies may contain
// passwords, bearer tokens, and personal information.
function logMiddleware(req, res, next) {
  const startedAt = Date.now();
  res.once("finish", () => {
    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
}

module.exports = logMiddleware;
