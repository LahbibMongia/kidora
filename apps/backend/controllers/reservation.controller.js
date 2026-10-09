const mongoose = require("mongoose");
const Reservation = require("../models/reservation.model");
const ReservationSlot = require("../models/reservation-slot.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

const ACTIVE = ["pending", "confirmed"];

function parseTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""))) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function parseDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(String(value || ""))) return null;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : new Date(`${timestamp.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function minutesFor(start, end) {
  const result = [];
  for (let minute = start; minute < end; minute += 1) result.push(minute);
  return result;
}

function apiError(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError"
    ? 400
    : error.code === 11000 ? 409 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ success: false, message: status === 500 ? "Internal server error" : error.message });
}

async function notify(user, message) {
  try {
    await Notification.create({ user, type: "reservation", message });
  } catch (error) {
    console.error("Could not create reservation notification:", error.message);
  }
}

async function releaseSlots(reservationId) {
  await ReservationSlot.deleteMany({ reservation: reservationId });
}

exports.createReservation = async (req, res) => {
  let reservationId;
  try {
    const parent = req.auth._id;
    const babysitter = req.body.babysitter || req.body.sitterId;
    const date = parseDate(req.body.date);
    const start = parseTime(req.body.startTime);
    const end = parseTime(req.body.endTime);
    const timeSlot = req.body.timeSlot;

    if (!babysitter || !date) return res.status(400).json({ success: false, message: "Babysitter and a valid date are required" });
    if ((start === null || end === null) && !timeSlot) return res.status(400).json({ success: false, message: "Provide valid startTime and endTime values" });

    const sitter = await User.findOne({ _id: babysitter, role: "babysitter", block: { $ne: true } });
    if (!sitter) return res.status(404).json({ success: false, message: "Babysitter profile not found" });
    const parentUser = await User.findOne({ _id: parent, role: "parent", block: { $ne: true } });
    if (!parentUser) return res.status(403).json({ success: false, message: "Only a parent can create a reservation" });

    let normalizedStart = start;
    let normalizedEnd = end;
    let normalizedSlot = timeSlot;
    let locks = [];
    if (start !== null && end !== null) {
      if (end <= start || end - start > 12 * 60) return res.status(400).json({ success: false, message: "Reservation duration must be between 1 minute and 12 hours" });
      normalizedSlot = `${req.body.startTime}-${req.body.endTime}`;
      locks = minutesFor(start, end);
    } else {
      const match = /^\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*-\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*$/.exec(timeSlot);
      if (!match) return res.status(400).json({ success: false, message: "timeSlot must use HH:mm-HH:mm format" });
      normalizedStart = parseTime(match[1]);
      normalizedEnd = parseTime(match[2]);
      if (normalizedEnd <= normalizedStart || normalizedEnd - normalizedStart > 12 * 60) return res.status(400).json({ success: false, message: "Reservation duration must be between 1 minute and 12 hours" });
      normalizedSlot = timeSlot;
      locks = minutesFor(normalizedStart, normalizedEnd);
    }

    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const existing = await Reservation.find({
      babysitter,
      date: { $gte: date, $lt: nextDay },
      status: { $in: ACTIVE },
    }).select("startTime endTime timeSlot").lean();
    const overlaps = existing.some((booking) => {
      let bookingStart = parseTime(booking.startTime);
      let bookingEnd = parseTime(booking.endTime);
      if (bookingStart === null || bookingEnd === null) {
        const match = /^\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*-\s*((?:[01]\d|2[0-3]):[0-5]\d)\s*$/.exec(booking.timeSlot || "");
        if (match) {
          bookingStart = parseTime(match[1]);
          bookingEnd = parseTime(match[2]);
        }
      }
      return bookingStart !== null && bookingEnd !== null && normalizedStart < bookingEnd && normalizedEnd > bookingStart;
    });
    if (overlaps) return res.status(409).json({ success: false, message: "This babysitter already has a booking during that time" });

    reservationId = new mongoose.Types.ObjectId();
    await ReservationSlot.insertMany(locks.map((minute) => ({
      babysitter,
      day: date.toISOString().slice(0, 10),
      minute,
      reservation: reservationId,
    })));

    const booking = await Reservation.create({
      _id: reservationId,
      parent,
      babysitter,
      date,
      timeSlot: normalizedSlot,
      startTime: normalizedStart === null ? undefined : `${String(Math.floor(normalizedStart / 60)).padStart(2, "0")}:${String(normalizedStart % 60).padStart(2, "0")}`,
      endTime: normalizedEnd === null ? undefined : `${String(Math.floor(normalizedEnd / 60)).padStart(2, "0")}:${String(normalizedEnd % 60).padStart(2, "0")}`,
      notes: String(req.body.notes || req.body.details || "").slice(0, 2000),
      totalPrice: ((normalizedEnd - normalizedStart) / 60) * (sitter.hourlyRate ?? 15),
    });
    await notify(babysitter, `You have received a new reservation request from ${parentUser.name}.`);
    return res.status(201).json({ success: true, message: "Reservation created successfully", data: booking });
  } catch (error) {
    if (reservationId) await releaseSlots(reservationId).catch((cleanupError) => console.error(cleanupError));
    return apiError(res, error);
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate("parent", "name email phone").populate("babysitter", "name hourlyRate").limit(500);
    return res.json({ success: true, data: reservations });
  } catch (error) { return apiError(res, error); }
};

exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("parent", "name email phone").populate("babysitter", "name hourlyRate");
    if (!reservation) return res.status(404).json({ success: false, message: "Reservation not found" });
    if (req.auth.role !== "admin" && String(reservation.parent._id) !== String(req.auth._id) && String(reservation.babysitter._id) !== String(req.auth._id)) return res.status(403).json({ success: false, message: "Insufficient permissions" });
    return res.json({ success: true, data: reservation });
  } catch (error) { return apiError(res, error); }
};

exports.getReservationsByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    if (req.auth.role !== "admin" && String(req.auth._id) !== String(parentId)) return res.status(403).json({ success: false, message: "Insufficient permissions" });
    const reservations = await Reservation.find({ parent: parentId }).populate("babysitter", "name hourlyRate phone image").sort({ date: -1 }).limit(500);
    return res.json({ success: true, data: reservations });
  } catch (error) { return apiError(res, error); }
};

exports.getReservationsByBabysitter = async (req, res) => {
  try {
    const { babysitterId } = req.params;
    if (req.auth.role !== "admin" && String(req.auth._id) !== String(babysitterId)) return res.status(403).json({ success: false, message: "Insufficient permissions" });
    const reservations = await Reservation.find({ babysitter: babysitterId }).populate("parent", "name phone adresse image").sort({ date: 1 }).limit(500);
    return res.json({ success: true, data: reservations });
  } catch (error) { return apiError(res, error); }
};

exports.updateReservation = async (req, res) => {
  try {
    const allowed = ["notes", "status"];
    const update = {};
    for (const key of allowed) {
      if (!Object.hasOwn(req.body, key)) continue;
      update[key] = key === "notes" ? String(req.body[key]).slice(0, 2000) : req.body[key];
    }
    if (update.status && update.status !== "completed") return res.status(400).json({ success: false, message: "Admin updates may only mark a reservation completed" });
    const previous = await Reservation.findById(req.params.id).select("status");
    if (!previous) return res.status(404).json({ success: false, message: "Reservation not found" });
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!reservation) return res.status(404).json({ success: false, message: "Reservation not found" });
    if (update.status === "completed" && ACTIVE.includes(previous.status)) await releaseSlots(reservation._id);
    return res.json({ success: true, data: reservation });
  } catch (error) { return apiError(res, error); }
};

exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: "Reservation not found" });
    await releaseSlots(reservation._id);
    return res.json({ success: true, data: reservation });
  } catch (error) { return apiError(res, error); }
};

async function changeStatus(req, res, { status, actorRole, message, notifyUser }) {
  try {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Reservation not found" });
    if (req.auth.role !== "admin" && (req.auth.role !== actorRole || String(existing[actorRole === "parent" ? "parent" : "babysitter"]) !== String(req.auth._id))) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    const allowedStatuses = actorRole === "parent" ? ["pending", "confirmed"] : ["pending"];
    const reservation = await Reservation.findOneAndUpdate(
      { _id: existing._id, status: { $in: allowedStatuses } },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!reservation) return res.status(409).json({ success: false, message: "This reservation can no longer change status" });
    if (status === "cancelled") await releaseSlots(reservation._id);
    await notify(reservation[notifyUser], message);
    return res.json({ success: true, message, data: reservation });
  } catch (error) { return apiError(res, error); }
}

exports.acceptReservation = (req, res) => changeStatus(req, res, {
  status: "confirmed", actorRole: "babysitter", notifyUser: "parent", message: "Your reservation has been confirmed",
});
exports.declineReservation = (req, res) => changeStatus(req, res, {
  status: "cancelled", actorRole: "babysitter", notifyUser: "parent", message: "Your reservation has been declined",
});
exports.cancelReservation = (req, res) => changeStatus(req, res, {
  status: "cancelled", actorRole: "parent", notifyUser: "babysitter", message: "A reservation has been cancelled by the parent",
});
