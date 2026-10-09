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
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        babysitter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
); 

const Avis = mongoose.model('Avis', avisSchema);
module.exports = Avis; 
