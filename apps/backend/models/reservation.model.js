const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        date: { type: Date, required: true },
        timeSlot: { type: String, required: true },
        startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
        endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
        notes: { type: String, maxlength: 2000 },
        totalPrice: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending"
        },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        babysitter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

reservationSchema.index({ babysitter: 1, date: 1, status: 1 });
reservationSchema.index({ parent: 1, createdAt: -1 });

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
