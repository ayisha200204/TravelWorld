const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
