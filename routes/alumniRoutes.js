const router = require("express").Router();
const c = require("../controllers/alumniController");

router.get("/search", c.search);
router.get("/featured", c.getFeatured);
router.get("/:id", c.getProfile);

module.exports = router;
