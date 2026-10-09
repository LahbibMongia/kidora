const Notification = require("../models/notification.model");

function errorResponse(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
}

function ownerFilter(req, id) {
  return req.auth.role === "admin" ? { _id: id } : { _id: id, user: req.auth._id };
}

exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne(ownerFilter(req, req.params.id));
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.json({ data: notification });
  } catch (error) { return errorResponse(res, error); }
};

exports.getNotificationByUser = async (req, res) => {
  try {
    if (req.auth.role !== "admin" && String(req.auth._id) !== String(req.params.userId)) return res.status(403).json({ message: "Insufficient permissions" });
    return res.json({ data: await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 }).limit(500) });
  } catch (error) { return errorResponse(res, error); }
};

exports.updateNotification = async (req, res) => {
  try {
    if (typeof req.body.read !== "boolean") return res.status(400).json({ message: "read must be a boolean" });
    const notification = await Notification.findOneAndUpdate(ownerFilter(req, req.params.id), { $set: { read: req.body.read } }, { new: true, runValidators: true });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.json({ data: notification });
  } catch (error) { return errorResponse(res, error); }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete(ownerFilter(req, req.params.id));
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.json({ message: "Notification deleted" });
  } catch (error) { return errorResponse(res, error); }
};
