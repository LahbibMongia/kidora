const Avis = require("../models/avis.model");
const User = require("../models/user.model");

function errorResponse(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
}

exports.createAvis = async (req, res) => {
  try {
    const babysitter = await User.findOne({ _id: req.body.babysitter, role: "babysitter" });
    if (!babysitter) return res.status(404).json({ message: "Babysitter not found" });
    const rating = req.body.rating ?? req.body.note;
    const comment = req.body.comment ?? req.body.commentaire;
    const avis = await Avis.create({ parent: req.auth._id, babysitter: babysitter._id, rating, comment });
    return res.status(201).json({ data: avis });
  } catch (error) { return errorResponse(res, error); }
};

exports.getAvis = async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id).populate("parent", "name").populate("babysitter", "name");
    if (!avis) return res.status(404).json({ message: "Review not found" });
    return res.json({ data: avis });
  } catch (error) { return errorResponse(res, error); }
};

exports.getAvisByParent = async (req, res) => {
  try { return res.json({ data: await Avis.find({ parent: req.params.parentId }).populate("parent", "name").populate("babysitter", "name").sort({ createdAt: -1 }).limit(500) }); }
  catch (error) { return errorResponse(res, error); }
};

exports.getAvisByBabysitter = async (req, res) => {
  try { return res.json({ data: await Avis.find({ babysitter: req.params.babysitterId }).populate("parent", "name").populate("babysitter", "name").sort({ createdAt: -1 }).limit(500) }); }
  catch (error) { return errorResponse(res, error); }
};

exports.updateAvis = async (req, res) => {
  try {
    const update = {};
    if (req.body.rating !== undefined || req.body.note !== undefined) update.rating = req.body.rating ?? req.body.note;
    if (req.body.comment !== undefined || req.body.commentaire !== undefined) update.comment = req.body.comment ?? req.body.commentaire;
    const avis = await Avis.findOneAndUpdate({ _id: req.params.id, parent: req.auth._id }, { $set: update }, { new: true, runValidators: true });
    if (!avis) return res.status(404).json({ message: "Review not found" });
    return res.json({ data: avis });
  } catch (error) { return errorResponse(res, error); }
};

exports.deleteAvis = async (req, res) => {
  try {
    const filter = req.auth.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, parent: req.auth._id };
    const avis = await Avis.findOneAndDelete(filter);
    if (!avis) return res.status(404).json({ message: "Review not found" });
    return res.json({ message: "Review deleted" });
  } catch (error) { return errorResponse(res, error); }
};
