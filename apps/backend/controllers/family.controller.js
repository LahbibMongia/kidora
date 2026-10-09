const crypto = require("crypto");
const Household = require("../models/household.model");
const User = require("../models/user.model");

const digest = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function parentUser(req) {
  if (req.auth.role !== "parent") return null;
  return User.findOne({ _id: req.auth._id, role: "parent", block: { $ne: true } });
}

exports.getHousehold = async (req, res) => {
  const user = await parentUser(req);
  if (!user) return res.status(403).json({ message: "Only parent accounts can access a household" });
  let household = user.household ? await Household.findById(user.household).populate("members", "name email") : null;
  if (!household) household = { members: [user], children: [] };
  return res.json({ data: household });
};

exports.inviteParent = async (req, res) => {
  try {
    const user = await parentUser(req);
    if (!user) return res.status(403).json({ message: "Only parent accounts can invite a family member" });
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email || email === user.email) return res.status(400).json({ message: "Enter another parent's email address" });
    const invited = await User.findOne({ email, role: "parent", block: { $ne: true } });
    if (!invited) return res.status(404).json({ message: "Create the other parent account before sending an invitation" });
    if (invited.household && String(invited.household) !== String(user.household || "")) return res.status(409).json({ message: "That parent already belongs to another household" });
    let household = user.household ? await Household.findById(user.household) : null;
    if (!household) {
      household = await Household.create({ members: [user._id] });
      user.household = household._id;
      await user.save();
    }
    const token = crypto.randomBytes(24).toString("base64url");
    household.invitations = household.invitations.filter((invite) => invite.email !== email);
    household.invitations.push({ email, tokenHash: digest(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    await household.save();
    return res.status(201).json({ data: { invitationToken: token, email, expiresAt: household.invitations.at(-1).expiresAt } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not create household invitation" });
  }
};

exports.joinHousehold = async (req, res) => {
  try {
    const user = await parentUser(req);
    if (!user) return res.status(403).json({ message: "Only parent accounts can join a household" });
    if (user.household) return res.status(409).json({ message: "This account already belongs to a household" });
    const token = String(req.body.invitationToken || "");
    if (!token) return res.status(400).json({ message: "Invitation code is required" });
    const household = await Household.findOne({ invitations: { $elemMatch: { email: user.email, tokenHash: digest(token), expiresAt: { $gt: new Date() } } } });
    if (!household) return res.status(400).json({ message: "Invitation code is invalid or expired" });
    household.members.push(user._id);
    household.invitations = household.invitations.filter((invite) => !(invite.email === user.email && invite.tokenHash === digest(token)));
    user.household = household._id;
    await Promise.all([household.save(), user.save()]);
    return res.json({ data: { householdId: household._id, members: household.members } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not join household" });
  }
};

exports.updateChildren = async (req, res) => {
  try {
    const user = await parentUser(req);
    if (!user) return res.status(403).json({ message: "Only parent accounts can update children" });
    if (!Array.isArray(req.body.children) || req.body.children.length > 20) return res.status(400).json({ message: "Children must be a list of up to 20 entries" });
    const children = req.body.children.map((child) => ({ name: String(child.name || "").trim(), age: child.age === "" || child.age == null ? undefined : Number(child.age) }));
    if (children.some((child) => !child.name || (child.age !== undefined && (!Number.isInteger(child.age) || child.age < 0 || child.age > 18)))) return res.status(400).json({ message: "Each child needs a name and a valid age" });
    let household = user.household ? await Household.findById(user.household) : null;
    if (!household) {
      household = await Household.create({ members: [user._id], children });
      user.household = household._id;
      await user.save();
    } else {
      household.children = children;
      await household.save();
    }
    return res.json({ data: { children: household.children } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not update children" });
  }
};
