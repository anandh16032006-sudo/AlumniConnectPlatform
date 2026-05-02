const router = require("express").Router();
const c = require("../controllers/authController");

router.post("/register", c.register);
router.post("/login", c.login);
router.post("/logout", c.logout);
router.get("/profile", c.getProfile);
router.post("/profile", c.updateProfile);

module.exports = router;
