const Message = require("../models/message.model");
const Notification = require("../models/notification.model");
const Reservation = require("../models/reservation.model");
const User = require("../models/user.model");

async function parentIdsFor(user) {
  if (user.role !== "parent" || !user.household) return [user._id];
  return User.find({ household: user.household, role: "parent" }).distinct("_id");
}

async function canMessage(sender, recipient) {
  const parents = await parentIdsFor(sender);
  if (sender.role === "parent" && recipient.role === "babysitter") {
    return Reservation.exists({ parent: { $in: parents }, babysitter: recipient._id });
  }
  if (sender.role === "babysitter" && recipient.role === "parent") {
    const recipientParents = await parentIdsFor(recipient);
    return Reservation.exists({ babysitter: sender._id, parent: { $in: recipientParents } });
  }
  return false;
}

exports.getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id).select("role household");
    const parents = await parentIdsFor(user);
    const query = user.role === "parent"
      ? { parent: { $in: parents } }
      : { babysitter: user._id };
    const reservations = await Reservation.find(query).select("parent babysitter").lean();
    const peerIds = [...new Set(reservations.map((booking) => String(user.role === "parent" ? booking.babysitter : booking.parent)))];
    const contacts = await User.find({ _id: { $in: peerIds }, block: { $ne: true } }).select("name email role image");
    return res.json({ data: contacts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load contacts" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const [sender, recipient] = await Promise.all([
      User.findById(req.auth._id).select("role household"),
      User.findById(req.params.peerId).select("name role household block"),
    ]);
    if (!sender || !recipient || recipient.block) return res.status(404).json({ message: "Contact not found" });
    if (!(await canMessage(sender, recipient))) return res.status(403).json({ message: "Messaging is available to booking contacts" });
    const messages = await Message.find({
      $or: [{ sender: sender._id, recipient: recipient._id }, { sender: recipient._id, recipient: sender._id }],
    }).populate("sender", "name role").populate("recipient", "name role").sort({ createdAt: 1 }).limit(500);
    await Message.updateMany({ sender: recipient._id, recipient: sender._id, readAt: null }, { $set: { readAt: new Date() } });
    return res.json({ data: { contact: recipient, messages } });
  } catch (error) {
    const status = error.name === "CastError" ? 400 : 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ message: status === 400 ? "Invalid contact" : "Could not load conversation" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text || text.length > 4000) return res.status(400).json({ message: "Message must contain between 1 and 4000 characters" });
    const [sender, recipient] = await Promise.all([
      User.findById(req.auth._id).select("name role household"),
      User.findById(req.body.recipient).select("name role household block"),
    ]);
    if (!sender || !recipient || recipient.block) return res.status(404).json({ message: "Contact not found" });
    if (!(await canMessage(sender, recipient))) return res.status(403).json({ message: "Messaging is available to booking contacts" });
    const message = await Message.create({ sender: sender._id, recipient: recipient._id, text });
    await Notification.create({ user: recipient._id, type: "message", message: `New message from ${sender.name}` });
    await message.populate("sender", "name role");
    await message.populate("recipient", "name role");
    return res.status(201).json({ data: message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not send message" });
  }
};
