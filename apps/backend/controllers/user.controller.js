const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const TOKEN_SECONDS = 3 * 24 * 60 * 60;
const editableFields = [
  "name", "phone", "adresse", "numberOfChildren", "specialRequirements",
  "hourlyRate", "experienceYears", "hasBackgroundCheck", "experience",
  "availability", "certif", "image",
];

function publicUser(user) {
  const value = user.toJSON();
  delete value.password;
  delete value.adminCode;
  delete value.loginAttempts;
  return value;
}

function apiError(res, error) {
  const status = error.name === "ValidationError" || error.name === "CastError"
    ? 400
    : error.code === 11000 ? 409 : 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
}

function createToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_SECONDS,
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, adresse, role = "parent", ...profile } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password must be strings" });
    }
    if (!["parent", "babysitter"].includes(role)) {
      return res.status(400).json({ message: "Registration role must be parent or babysitter" });
    }
    const allowedProfile = role === "parent"
      ? ["numberOfChildren", "specialRequirements"]
      : ["hourlyRate", "experienceYears", "experience", "availability", "certif"];
    const userData = { name, email, password, phone, adresse, role };
    for (const key of allowedProfile) {
      if (Object.hasOwn(profile, key)) userData[key] = profile[key];
    }
    const user = await User.create(userData);
    res.status(201).json({ message: "Registration successful", token: createToken(user), user: publicUser(user) });
  } catch (error) {
    apiError(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.authenticate(email, password);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    res.json({ message: "Login successful", token: createToken(user), user: publicUser(user) });
  } catch (error) {
    apiError(res, error);
  }
};

exports.getBabysitters = async (req, res) => {
  try {
    const query = {
      role: "babysitter",
      $and: [{ $or: [{ block: false }, { block: { $exists: false } }] }],
    };
    if (req.query.search) {
      if (String(req.query.search).length > 100) return res.status(400).json({ message: "Search terms may not exceed 100 characters" });
      const safeSearch = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$and.push({ $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { adresse: { $regex: safeSearch, $options: "i" } },
      ] });
    }
    if (req.query.maxRate !== undefined) {
      const maxRate = Number(req.query.maxRate);
      if (!Number.isFinite(maxRate) || maxRate < 0) return res.status(400).json({ message: "maxRate must be a non-negative number" });
      query.hourlyRate = { $lte: maxRate };
    }
    const users = await User.find(query).select("-password -loginAttempts").limit(100);
    res.json({ message: "Babysitters fetched successfully", data: users });
  } catch (error) {
    apiError(res, error);
  }
};

exports.getBabysitterById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "babysitter", block: { $ne: true } }).select("-password -loginAttempts");
    if (!user) return res.status(404).json({ message: "Babysitter not found" });
    res.json({ message: "Babysitter profile fetched successfully", data: user });
  } catch (error) {
    apiError(res, error);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -loginAttempts").limit(500);
    res.json({ message: "Users retrieved successfully", data: users });
  } catch (error) {
    apiError(res, error);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -loginAttempts");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User retrieved successfully", data: user });
  } catch (error) {
    apiError(res, error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { role, name, email, password, phone, adresse, ...profile } = req.body;
    if (!["parent", "babysitter"].includes(role)) return res.status(400).json({ message: "A parent or babysitter role is required" });
    const allowedProfile = role === "parent"
      ? ["numberOfChildren", "specialRequirements"]
      : ["hourlyRate", "experienceYears", "hasBackgroundCheck", "experience", "availability", "certif"];
    const data = { role, name, email, password, phone, adresse };
    for (const key of allowedProfile) if (Object.hasOwn(profile, key)) data[key] = profile[key];
    const user = await User.create(data);
    res.status(201).json({ message: "User created successfully", data: publicUser(user) });
  } catch (error) {
    apiError(res, error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const profileFields = req.auth.role === "admin"
      ? editableFields
      : editableFields.filter((field) => ["name", "phone", "adresse", "image"].includes(field) ||
        (req.auth.role === "parent" && ["numberOfChildren", "specialRequirements"].includes(field)) ||
        (req.auth.role === "babysitter" && ["hourlyRate", "experienceYears", "experience", "availability", "certif"].includes(field)));
    for (const field of profileFields) {
      if (Object.hasOwn(req.body, field)) user[field] = req.body[field];
    }
    await user.save();
    res.json({ message: "User updated successfully", data: publicUser(user) });
  } catch (error) {
    apiError(res, error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully", data: publicUser(user) });
  } catch (error) {
    apiError(res, error);
  }
};

