const express = require("express");
const router = express.Router();
const controller = require("../controllers/reservation.controller");
const { authenticate, allowRoles } = require("../middlewares/auth");

router.use(authenticate);
router.post("/", allowRoles("parent"), controller.createReservation);
router.get("/", allowRoles("admin"), controller.getAllReservations);
router.get("/parent/:parentId", controller.getReservationsByParent);
router.get("/babysitter/:babysitterId", controller.getReservationsByBabysitter);
router.get("/:id", controller.getReservationById);
router.put("/:id", allowRoles("admin"), controller.updateReservation);
router.delete("/:id", allowRoles("admin"), controller.deleteReservation);
router.patch("/:id/cancel", allowRoles("parent", "admin"), controller.cancelReservation);
router.patch("/:id/confirm", allowRoles("babysitter", "admin"), controller.acceptReservation);
router.patch("/:id/reject", allowRoles("babysitter", "admin"), controller.declineReservation);

module.exports = router;
