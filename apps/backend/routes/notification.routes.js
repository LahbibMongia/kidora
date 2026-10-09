const express = require("express");
const router = express.Router();
const controller = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth");

router.use(authenticate);
router.get("/user/:userId", controller.getNotificationByUser);
router.get("/:id", controller.getNotification);
router.patch("/:id", controller.updateNotification);
router.delete("/:id", controller.deleteNotification);

module.exports = router;
