require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model");
const { getMongoUri } = require("../config/db");

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE before creating an admin");
  }
  const existing = await User.findOne({ email: ADMIN_EMAIL.trim().toLowerCase() });
  if (existing) throw new Error("An account with ADMIN_EMAIL already exists");
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    phone: ADMIN_PHONE,
    role: "admin",
  });
  console.info(`Created admin account ${admin.email}`);
}

mongoose.connect(getMongoUri())
  .then(main)
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error("Admin creation failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
