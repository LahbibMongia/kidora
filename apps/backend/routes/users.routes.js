const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const upload = require("../middlewares/uploadfile");
const { authenticate, allowRoles, allowSelfOrAdmin } = require("../middlewares/auth");
const loginRateLimit = require("../middlewares/login-rate-limit");

router.get("/babysitters", userController.getBabysitters);
router.get("/babysitters/:id", userController.getBabysitterById);
router.post("/register", userController.register);
router.post("/login", loginRateLimit, userController.login);

router.get("/", authenticate, allowRoles("admin"), userController.getAllUsers);
router.get("/:id", authenticate, allowSelfOrAdmin(), userController.getUserById);
router.post("/", authenticate, allowRoles("admin"), userController.createUser);
router.post("/upload", authenticate, upload.single("image"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "An image file is required" });
  try {
    const { filename } = await upload.saveImage(req.file);
    return res.status(201).json({ message: "Upload successful", file: { filename, path: `/images/${filename}` } });
  } catch (error) { return next(error); }
});
router.put("/:id", authenticate, allowSelfOrAdmin(), userController.updateUser);
router.delete("/:id", authenticate, allowRoles("admin"), userController.deleteUser);

module.exports = router;
