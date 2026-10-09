const mongoose = require ('mongoose');

const recommendationSchema = new mongoose.Schema(
    {
        score_matching: { type: Number, required: true, min: 0, max: 100 },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        babysitter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        
    },
    { timestamps: true }
);

const Recommendation = mongoose.model('Recommendation', recommendationSchema);
module.exports = Recommendation;  
