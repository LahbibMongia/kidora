const express = require("express");
const router = express.Router();
const controller = require("../controllers/avis.controller");
const { authenticate, allowRoles } = require("../middlewares/auth");

router.get("/parent/:parentId", controller.getAvisByParent);
router.get("/babysitter/:babysitterId", controller.getAvisByBabysitter);
router.get("/:id", controller.getAvis);
router.post("/", authenticate, allowRoles("parent", "babysitter"), controller.createAvis);
router.put("/:id", authenticate, allowRoles("parent", "babysitter"), controller.updateAvis);
router.delete("/:id", authenticate, allowRoles("parent", "babysitter", "admin"), controller.deleteAvis);

module.exports = router;
