const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: "Name, email and a password of at least 6 characters are required." });
    const normalized = email.toLowerCase().trim();
    if (await User.findOne({ email: normalized })) return res.status(409).json({ message: "Email is already registered." });
    const user = await User.create({ name: name.trim(), email: normalized, password: await bcrypt.hash(password, 12) });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: "Registration failed." }); }
});
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
      return res.status(401).json({ message: "Incorrect email or password." });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "development_secret_change_me", { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (_err) { res.status(500).json({ message: "Login failed." }); }
});
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in." });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development_secret_change_me");
    const user = await User.findById(payload.id).select("_id name email");
    if (!user) return res.status(401).json({ message: "Account not found." });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (_err) { res.status(401).json({ message: "Invalid session." }); }
});
module.exports = router;
