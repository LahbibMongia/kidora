const Avis = require("../models/avis.model");
const User = require("../models/user.model");
const Reservation = require("../models/reservation.model");

function errorResponse(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
}

exports.createAvis = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.body.reservation);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (!["confirmed", "completed"].includes(reservation.status)) return res.status(409).json({ message: "Only confirmed or completed bookings can be reviewed" });
    let isParent = req.auth.role === "parent" && String(reservation.parent) === String(req.auth._id);
    if (req.auth.role === "parent" && !isParent) {
      const [requester, bookingParent] = await Promise.all([
        User.findById(req.auth._id).select("household"),
        User.findById(reservation.parent).select("household"),
      ]);
      isParent = Boolean(requester?.household && String(requester.household) === String(bookingParent?.household));
    }
    const isBabysitter = req.auth.role === "babysitter" && String(reservation.babysitter) === String(req.auth._id);
    if (!isParent && !isBabysitter) return res.status(403).json({ message: "Only booking participants can leave a review" });
    const revieweeId = isParent ? reservation.babysitter : reservation.parent;
    const reviewee = await User.findById(revieweeId).select("role");
    if (!reviewee || (isParent && reviewee.role !== "babysitter") || (isBabysitter && reviewee.role !== "parent")) return res.status(400).json({ message: "Invalid review participant" });
    const rating = req.body.rating ?? req.body.note;
    const comment = req.body.comment ?? req.body.commentaire;
    const avis = await Avis.create({ reviewer: req.auth._id, reviewee: revieweeId, reservation: reservation._id, parent: reservation.parent, babysitter: reservation.babysitter, rating, comment });
    return res.status(201).json({ data: avis });
  } catch (error) { return errorResponse(res, error); }
};

exports.getAvis = async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id).populate("reviewer", "name").populate("reviewee", "name role").populate("parent", "name").populate("babysitter", "name");
    if (!avis) return res.status(404).json({ message: "Review not found" });
    return res.json({ data: avis });
  } catch (error) { return errorResponse(res, error); }
};

exports.getAvisByParent = async (req, res) => {
  try { return res.json({ data: await Avis.find({ $or: [{ reviewer: req.params.parentId }, { reviewer: { $exists: false }, parent: req.params.parentId }] }).populate("reviewer", "name").populate("reviewee", "name role").populate("parent", "name").populate("babysitter", "name").sort({ createdAt: -1 }).limit(500) }); }
  catch (error) { return errorResponse(res, error); }
};

exports.getAvisByBabysitter = async (req, res) => {
  try { return res.json({ data: await Avis.find({ $or: [{ reviewee: req.params.babysitterId }, { reviewee: { $exists: false }, babysitter: req.params.babysitterId }] }).populate("reviewer", "name").populate("reviewee", "name role").populate("parent", "name").populate("babysitter", "name").sort({ createdAt: -1 }).limit(500) }); }
  catch (error) { return errorResponse(res, error); }
};

exports.updateAvis = async (req, res) => {
  try {
    const update = {};
    if (req.body.rating !== undefined || req.body.note !== undefined) update.rating = req.body.rating ?? req.body.note;
    if (req.body.comment !== undefined || req.body.commentaire !== undefined) update.comment = req.body.comment ?? req.body.commentaire;
    const avis = await Avis.findOneAndUpdate({ _id: req.params.id, $or: [{ reviewer: req.auth._id }, { parent: req.auth._id }] }, { $set: update }, { new: true, runValidators: true });
    if (!avis) return res.status(404).json({ message: "Review not found" });
    return res.json({ data: avis });
  } catch (error) { return errorResponse(res, error); }
};

exports.deleteAvis = async (req, res) => {
  try {
    const filter = req.auth.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, $or: [{ reviewer: req.auth._id }, { parent: req.auth._id }] };
    const avis = await Avis.findOneAndDelete(filter);
    if (!avis) return res.status(404).json({ message: "Review not found" });
    return res.json({ message: "Review deleted" });
  } catch (error) { return errorResponse(res, error); }
};
