const Recommendation = require("../models/recommendation.model");
const User = require("../models/user.model");
const Reservation = require("../models/reservation.model");
const Avis = require("../models/avis.model");
const { buildTextScores, calculateRecommendationScore } = require("../services/recommendationScoring");

function errorResponse(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
}

function permitted(req, parentId, babysitterId) {
  return req.auth.role === "admin" || String(req.auth._id) === String(parentId) || String(req.auth._id) === String(babysitterId);
}

exports.getTopRecommendations = async (req, res) => {
  try {
    const filter = { role: "babysitter", block: { $ne: true } };
    if (req.query.maxRate !== undefined && Number.isFinite(Number(req.query.maxRate))) filter.hourlyRate = { $lte: Number(req.query.maxRate) };
    const sitters = await User.find(filter).select("-password -loginAttempts").limit(100);
    const query = String(req.query.search || "").slice(0, 300);
    const textScores = buildTextScores(sitters, query);
    const ids = sitters.map((sitter) => sitter._id);
    const [reviews, history] = await Promise.all([
      Avis.aggregate([
        { $match: { $or: [{ reviewee: { $in: ids } }, { reviewee: { $exists: false }, babysitter: { $in: ids } }] } },
        { $group: { _id: { $ifNull: ["$reviewee", "$babysitter"] }, rating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
      Reservation.aggregate([
        { $match: { babysitter: { $in: ids } } },
        { $group: { _id: "$babysitter", completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }, total: { $sum: 1 } } },
      ]),
    ]);
    const reviewBySitter = new Map(reviews.map((entry) => [String(entry._id), entry]));
    const historyBySitter = new Map(history.map((entry) => [String(entry._id), entry]));
    const data = sitters.map((sitter) => {
      const review = reviewBySitter.get(String(sitter._id));
      const bookings = historyBySitter.get(String(sitter._id));
      const rating = review ? review.rating : 3.5;
      const completed = bookings?.completed || 0;
      const availability = String(sitter.availability || "").trim().length > 0;
      const experienceScore = Math.min(Number(sitter.experienceYears || 0) / 10, 1) * 100;
      const textMatchScore = textScores.get(String(sitter._id)) || 0;
      const trustScore = (rating / 5) * 45 + Math.min(completed / 10, 1) * 25 + (availability ? 20 : 0) + experienceScore * 0.1;
      const score = calculateRecommendationScore({ query, textMatchScore, trustScore });
      return {
        ...sitter.toJSON(),
        rating: review ? Number(rating.toFixed(1)) : null,
        reviewCount: review?.count || 0,
        completedBookings: completed,
        textMatchScore: Number((textMatchScore * 100).toFixed(1)),
        recommendationScore: score,
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore || String(a.name).localeCompare(String(b.name))).slice(0, 3);
    return res.json({ data });
  } catch (error) { return errorResponse(res, error); }
};

exports.createRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.create(req.body);
    return res.status(201).json({ data: recommendation });
  } catch (error) { return errorResponse(res, error); }
};

exports.getRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    if (!recommendation) return res.status(404).json({ message: "Recommendation not found" });
    if (!permitted(req, recommendation.parent, recommendation.babysitter)) return res.status(403).json({ message: "Insufficient permissions" });
    return res.json({ data: recommendation });
  } catch (error) { return errorResponse(res, error); }
};

exports.getRecommendationByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    if (req.auth.role !== "admin" && String(req.auth._id) !== String(parentId)) return res.status(403).json({ message: "Insufficient permissions" });
    return res.json({ data: await Recommendation.find({ parent: parentId }).sort({ createdAt: -1 }).limit(500) });
  } catch (error) { return errorResponse(res, error); }
};

exports.getRecommendationByBabysitter = async (req, res) => {
  try {
    const { babysitterId } = req.params;
    if (req.auth.role !== "admin" && String(req.auth._id) !== String(babysitterId)) return res.status(403).json({ message: "Insufficient permissions" });
    return res.json({ data: await Recommendation.find({ babysitter: babysitterId }).sort({ createdAt: -1 }).limit(500) });
  } catch (error) { return errorResponse(res, error); }
};

exports.updateRecommendation = async (req, res) => {
  try {
    const update = {};
    for (const key of ["score_matching", "parent", "babysitter"]) if (Object.hasOwn(req.body, key)) update[key] = req.body[key];
    const recommendation = await Recommendation.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!recommendation) return res.status(404).json({ message: "Recommendation not found" });
    return res.json({ data: recommendation });
  } catch (error) { return errorResponse(res, error); }
};

exports.deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findByIdAndDelete(req.params.id);
    if (!recommendation) return res.status(404).json({ message: "Recommendation not found" });
    return res.json({ data: recommendation });
  } catch (error) { return errorResponse(res, error); }
};
