require("dotenv").config();

const mongoose = require("mongoose");
const { connectToMongoDB } = require("../config/db");
const User = require("../models/user.model");
const Avis = require("../models/avis.model");
const Recommendation = require("../models/recommendation.model");
const Reservation = require("../models/reservation.model");
const ReservationSlot = require("../models/reservation-slot.model");

const applyChanges = process.argv.includes("--apply");

function dayFrom(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value !== "string") return null;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  const timestamp = day ? new Date(value + "T00:00:00.000Z") : new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;
  const result = new Date(Date.UTC(timestamp.getUTCFullYear(), timestamp.getUTCMonth(), timestamp.getUTCDate()));
  if (day && result.toISOString().slice(0, 10) !== day) return null;
  return result;
}

function minuteOf(value) {
  const match = /^\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*$/.exec(String(value || ""));
  if (!match) return null;
  const parts = match[1].split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function timeFromSlot(value) {
  const match = /^\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*-\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*$/.exec(String(value || ""));
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function idString(value) {
  return value == null ? "" : String(value);
}

async function migrate() {
  await connectToMongoDB();
  const [users, reviews, recommendations, reservations, existingLocks] = await Promise.all([
    User.collection.find({}, { projection: { email: 1 } }).toArray(),
    Avis.collection.find({}).toArray(),
    Recommendation.collection.find({}).toArray(),
    Reservation.collection.find({}).toArray(),
    ReservationSlot.collection.find({}).toArray(),
  ]);

  const emailGroups = new Map();
  for (const user of users) {
    const normalized = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
    if (!normalized || normalized === user.email) continue;
    const group = emailGroups.get(normalized) || [];
    group.push(user);
    emailGroups.set(normalized, group);
  }
  const emailCollisions = new Set();
  for (const [email, group] of emailGroups) {
    const alreadyPresent = users.some((user) => user.email === email && !group.some((item) => item._id.equals(user._id)));
    if (group.length > 1 || alreadyPresent) {
      for (const user of group) emailCollisions.add(idString(user._id));
    }
  }
  const userChanges = users.filter((user) => !emailCollisions.has(idString(user._id)) && typeof user.email === "string" && user.email !== user.email.trim().toLowerCase());

  const reviewChanges = [];
  const invalidReviews = [];
  for (const review of reviews) {
    const update = {};
    const rating = review.rating === undefined ? Number(review.note) : Number(review.rating);
    if (review.rating === undefined && Number.isFinite(rating) && rating >= 1 && rating <= 5) update.rating = rating;
    const comment = review.comment === undefined ? review.commentaire : review.comment;
    if (review.comment === undefined && typeof comment === "string") update.comment = comment.slice(0, 2000);
    const hasValidRating = (update.rating ?? rating) >= 1 && (update.rating ?? rating) <= 5;
    if ((review.note !== undefined || review.commentaire !== undefined) && hasValidRating) {
      reviewChanges.push({ review, update, unset: { note: "", commentaire: "" } });
    } else if (review.note !== undefined || review.commentaire !== undefined) {
      invalidReviews.push(idString(review._id));
      continue;
    }
    if (!review.createdAt && review._id && typeof review._id.getTimestamp === "function") {
      update.createdAt = review._id.getTimestamp();
      update.updatedAt = update.createdAt;
      reviewChanges.push({ review, update, unset: {} });
    }
  }

  const recommendationChanges = recommendations
    .filter((item) => !item.createdAt && item._id && typeof item._id.getTimestamp === "function")
    .map((item) => ({ item, date: item._id.getTimestamp() }));

  const reservationChanges = [];
  const unparseableReservations = [];
  const plannedBookings = [];
  for (const reservation of reservations) {
    const date = dayFrom(reservation.date);
    let start = minuteOf(reservation.startTime);
    let end = minuteOf(reservation.endTime);
    if (start === null || end === null) {
      const parsed = timeFromSlot(reservation.timeSlot);
      if (parsed) {
        start = minuteOf(parsed.start);
        end = minuteOf(parsed.end);
      }
    }
    const validStatus = ["pending", "confirmed", "cancelled", "completed"].includes(reservation.status);
    if (!date || start === null || end === null || end <= start || end - start > 12 * 60 || !validStatus) {
      unparseableReservations.push(idString(reservation._id));
      continue;
    }
    const startTime = String(Math.floor(start / 60)).padStart(2, "0") + ":" + String(start % 60).padStart(2, "0");
    const endTime = String(Math.floor(end / 60)).padStart(2, "0") + ":" + String(end % 60).padStart(2, "0");
    const timeSlot = startTime + "-" + endTime;
    if (!(reservation.date instanceof Date) || reservation.date.getTime() !== date.getTime() ||
        reservation.startTime !== startTime || reservation.endTime !== endTime || reservation.timeSlot !== timeSlot) {
      reservationChanges.push({ reservation, date, startTime, endTime, timeSlot });
    }
    if (["pending", "confirmed"].includes(reservation.status)) {
      plannedBookings.push({ reservation, date, start, end });
    }
  }

  const occupied = new Map();
  const collidingReservations = new Set();
  for (const booking of plannedBookings) {
    const sitter = idString(booking.reservation.babysitter);
    if (!sitter) {
      collidingReservations.add(idString(booking.reservation._id));
      continue;
    }
    for (let minute = booking.start; minute < booking.end; minute += 1) {
      const key = sitter + "|" + booking.date.toISOString().slice(0, 10) + "|" + minute;
      const owner = occupied.get(key);
      if (owner && owner !== idString(booking.reservation._id)) {
        collidingReservations.add(owner);
        collidingReservations.add(idString(booking.reservation._id));
      } else {
        occupied.set(key, idString(booking.reservation._id));
      }
    }
  }
  const oldLockOwners = new Map();
  const duplicateExistingLocks = new Set();
  for (const lock of existingLocks) {
    const key = idString(lock.babysitter) + "|" + lock.day + "|" + lock.minute;
    const owner = idString(lock.reservation);
    if (oldLockOwners.has(key)) duplicateExistingLocks.add(key);
    oldLockOwners.set(key, owner);
  }
  for (const [key, owner] of occupied) {
    const oldOwner = oldLockOwners.get(key);
    if (oldOwner && oldOwner !== owner) {
      collidingReservations.add(oldOwner);
      collidingReservations.add(owner);
    }
  }
  const locksToCreate = [];
  for (const booking of plannedBookings) {
    const bookingId = idString(booking.reservation._id);
    if (collidingReservations.has(bookingId)) continue;
    for (let minute = booking.start; minute < booking.end; minute += 1) {
      const key = idString(booking.reservation.babysitter) + "|" + booking.date.toISOString().slice(0, 10) + "|" + minute;
      if (oldLockOwners.get(key) === bookingId) continue;
      locksToCreate.push({
        babysitter: booking.reservation.babysitter,
        day: booking.date.toISOString().slice(0, 10),
        minute,
        reservation: booking.reservation._id,
      });
    }
  }

  const summary = {
    mode: applyChanges ? "apply" : "dry-run",
    usersToNormalize: userChanges.length,
    normalizedEmailCollisionGroups: emailCollisions.size,
    reviewsToNormalize: reviewChanges.length,
    invalidLegacyReviews: invalidReviews.length,
    recommendationTimestampsToAdd: recommendationChanges.length,
    reservationsToNormalize: reservationChanges.length,
    reservationsWithUnparseableData: unparseableReservations.length,
    activeReservationConflicts: collidingReservations.size,
    duplicateExistingSlotKeys: duplicateExistingLocks.size,
    reservationLocksToCreate: locksToCreate.length,
  };

  if (applyChanges) {
    if (duplicateExistingLocks.size) {
      throw new Error("Existing reservation slot duplicates must be resolved before applying this migration");
    }
    await ReservationSlot.collection.createIndex(
      { babysitter: 1, day: 1, minute: 1 },
      { unique: true }
    );
    for (const user of userChanges) {
      await User.collection.updateOne({ _id: user._id }, { $set: { email: user.email.trim().toLowerCase() } });
    }
    const reviewMap = new Map();
    for (const item of reviewChanges) {
      const current = reviewMap.get(idString(item.review._id)) || { review: item.review, update: {}, unset: {} };
      Object.assign(current.update, item.update);
      Object.assign(current.unset, item.unset);
      reviewMap.set(idString(item.review._id), current);
    }
    for (const { review, update, unset } of reviewMap.values()) {
      const operation = {};
      if (Object.keys(update).length) operation.$set = update;
      if (Object.keys(unset).length) operation.$unset = unset;
      await Avis.collection.updateOne({ _id: review._id }, operation);
    }
    for (const { item, date } of recommendationChanges) {
      await Recommendation.collection.updateOne({ _id: item._id }, { $set: { createdAt: date, updatedAt: date } });
    }
    for (const item of reservationChanges) {
      await Reservation.collection.updateOne({ _id: item.reservation._id }, { $set: {
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        timeSlot: item.timeSlot,
      } });
    }
    if (locksToCreate.length) await ReservationSlot.collection.insertMany(locksToCreate, { ordered: true });
  }

  console.info(JSON.stringify(summary, null, 2));
  if (emailCollisions.size || invalidReviews.length || unparseableReservations.length || collidingReservations.size) {
    console.warn("Some legacy records need manual review; see the counts above before applying or starting the API.");
  }
}

migrate()
  .catch((error) => {
    console.error("Legacy data migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
