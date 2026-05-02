const router = require("express").Router();
const c = require("../controllers/mentorshipController");

router.get("/bookings", c.getBookings);
router.post("/request", c.request);
router.put("/:id/status", c.updateStatus);

module.exports = router;
