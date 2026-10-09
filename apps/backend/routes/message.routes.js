const express = require("express");
const { authenticate, allowRoles } = require("../middlewares/auth");
const controller = require("../controllers/message.controller");

const router = express.Router();
router.use(authenticate, allowRoles("parent", "babysitter"));
router.get("/contacts", controller.getContacts);
router.get("/:peerId", controller.getConversation);
router.post("/", controller.sendMessage);
module.exports = router;
