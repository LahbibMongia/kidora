const express = require("express");
const router = express.Router();
const controller = require("../controllers/recommendation.controller");
const { authenticate, allowRoles } = require("../middlewares/auth");

router.use(authenticate);
router.get("/parent/:parentId", controller.getRecommendationByParent);
router.get("/babysitter/:babysitterId", controller.getRecommendationByBabysitter);
router.get("/:id", controller.getRecommendation);
router.post("/", allowRoles("admin"), controller.createRecommendation);
router.put("/:id", allowRoles("admin"), controller.updateRecommendation);
router.delete("/:id", allowRoles("admin"), controller.deleteRecommendation);

module.exports = router;
