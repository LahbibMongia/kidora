const express = require("express");
const { authenticate, allowRoles } = require("../middlewares/auth");
const controller = require("../controllers/family.controller");

const router = express.Router();
router.use(authenticate, allowRoles("parent"));
router.get("/me", controller.getHousehold);
router.post("/invite", controller.inviteParent);
router.post("/join", controller.joinHousehold);
router.put("/children", controller.updateChildren);
module.exports = router;
