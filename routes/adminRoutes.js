const router = require("express").Router();
const c = require("../controllers/adminController");

router.get("/pending", c.getPending);
router.get("/users", c.getUsers);
router.get("/insights", c.getInsights);
router.get("/jobs", c.getJobs);
router.post("/approve", c.approve);
router.post("/reject", c.reject);
router.post("/users", c.addUser);
router.delete("/users/:id", c.deleteUser);
router.delete("/jobs/:id", c.deleteJob);

module.exports = router;
