const router = require("express").Router();
const c = require("../controllers/jobController");

router.get("/", c.getJobs);
router.post("/post", c.postJob);
router.delete("/:id", c.deleteJob);

module.exports = router;
