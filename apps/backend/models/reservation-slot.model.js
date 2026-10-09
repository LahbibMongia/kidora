const mongoose = require("mongoose");

const reservationSlotSchema = new mongoose.Schema({
  babysitter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  day: { type: String, required: true },
  minute: { type: Number, required: true },
  reservation: { type: mongoose.Schema.Types.ObjectId, required: true },
});

reservationSlotSchema.index({ babysitter: 1, day: 1, minute: 1 }, { unique: true });
reservationSlotSchema.index({ reservation: 1 });

module.exports = mongoose.model("ReservationSlot", reservationSlotSchema);
