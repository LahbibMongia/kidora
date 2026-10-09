const Recommendation = require("../models/recommendation.model");

function errorResponse(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
}

function permitted(req, parentId, babysitterId) {
  return req.auth.role === "admin" || String(req.auth._id) === String(parentId) || String(req.auth._id) === String(babysitterId);
}

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
