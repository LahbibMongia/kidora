require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
const { connectToMongoDB } = require("./config/db");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users.routes");
const reservationRouter = require("./routes/reservation.routes");
const notificationRouter = require("./routes/notification.routes");
const avisRouter = require("./routes/avis.routes");
const recommendationRouter = require("./routes/recommendation.routes");
const familyRouter = require("./routes/family.routes");
const ReservationSlot = require("./models/reservation-slot.model");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.use(logger(":method :status :response-time ms"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "starting",
    database: ready ? "connected" : "disconnected",
  });
});

app.use("/index", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/reviews", avisRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/families", familyRouter);

if (process.env.NODE_ENV === "production") {
  const frontendBuild = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(frontendBuild, { index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(frontendBuild, "index.html"));
  });
}

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode ||
    (err.code === "LIMIT_FILE_SIZE" ? 413 : err.code === "LIMIT_UNEXPECTED_FILE" ? 400 : 0) ||
    (err.message === "Origin is not allowed by CORS" || err.message.startsWith("Only ") ? 400 : 0) ||
    (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && app.get("env") !== "development"
      ? "Internal server error"
      : err.message || "Internal server error",
  });
});

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters");
  }
  await connectToMongoDB();
  await ReservationSlot.init();
  const port = Number(process.env.PORT || 5000);
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "0.0.0.0", resolve);
  });
  console.info(`API listening on http://0.0.0.0:${port}`);
  return server;
}

if (require.main === module) {
  startServer().then((server) => {
    const shutdown = async () => {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }).catch(async (error) => {
    console.error("API startup failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
