const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

async function authenticate(req, res, next) {
  const value = req.get("authorization") || "";
  const [scheme, token] = value.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  try {
    const user = await User.findById(claims.id);
    if (!user || user.block) return res.status(401).json({ message: "Account is unavailable" });
    req.auth = user;
    return next();
  } catch (error) { return next(error); }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

function allowSelfOrAdmin(getId = (req) => req.params.id) {
  return (req, res, next) => {
    if (req.auth?.role === "admin" || String(req.auth?._id) === String(getId(req))) {
      return next();
    }
    return res.status(403).json({ message: "You may only access your own account" });
  };
}

module.exports = { authenticate, allowRoles, allowSelfOrAdmin };
