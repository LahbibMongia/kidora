const mongoose = require ('mongoose');

const avisSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            required: [true, "rating is required"],
            min: 1,
            max: 5,
        },
        comment: { type: String, maxlength: 2000 },
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reservation: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        babysitter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
); 

avisSchema.index({ reviewer: 1, reservation: 1 }, { unique: true, partialFilterExpression: { reservation: { $exists: true } } });

const Avis = mongoose.model('Avis', avisSchema);
module.exports = Avis; 
