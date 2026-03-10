// ====================== IMPORTS ======================
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent browser caching
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Serve uploads folder (for uploaded images/videos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Serve images folder (static logos, etc.)
app.use("/images", express.static(path.join(__dirname, "images")));
// Serve videos folder
app.use("/videos", express.static(path.join(__dirname, "videos")));

// ====================== MONGODB CONNECTION ======================
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/nudiutsava")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ====================== SESSION CONFIG ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  })
);

// ====================== NODEMAILER TRANSPORTER ======================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ====================== SCHEMAS ======================
const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});
const Admin = mongoose.model("Admin", adminSchema);

const homeImageSchema = new mongoose.Schema({
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const HomeImage = mongoose.model("HomeImage", homeImageSchema);

const eventSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  registerPage: String,
  hasForm: Boolean,
  createdAt: { type: Date, default: Date.now },
});
const Event = mongoose.model("Event", eventSchema);

const sponsorSchema = new mongoose.Schema({
  title: String,
  logoUrl: String,
  coverUrl: String,
  videoUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const Sponsor = mongoose.model("Sponsor", sponsorSchema);

const gallerySchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const Gallery = mongoose.model("Gallery", gallerySchema);

const registrationSchema = new mongoose.Schema({
  eventName: String,
  formData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});
const Registration = mongoose.model("Registration", registrationSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

// ====================== FILE UPLOAD ======================
const fs = require("fs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ====================== AUTH MIDDLEWARE ======================
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.redirect("/admin");
  }
  next();
}

// ====================== CREATE DEFAULT ADMIN ======================
async function initAdmin() {
  const admin = await Admin.findOne({ username: "admin" });
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await Admin.create({ username: "admin", password: hashed });
    console.log("✅ Default Admin Created\nUsername: admin\nPassword: admin123");
  }
}
initAdmin();

// ====================== ROUTES ======================
app.get(["/admin", "/admin.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/dashboard", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    req.session.adminId = admin._id;
    req.session.save(() => {
      res.json({ success: true, redirect: "/dashboard" });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout error");
    res.clearCookie("connect.sid");
    res.redirect("/admin");
  });
});

app.get("/admin/check", (req, res) => {
  res.json({ loggedIn: !!req.session.adminId });
});

// ====================== HOME IMAGES ======================
app.post("/api/home-images", requireAdmin, upload.single("image"), async (req, res) => {
  const image = new HomeImage({ imageUrl: "/uploads/" + req.file.filename });
  await image.save();
  res.json(image);
});

app.get("/api/home-images", async (req, res) => {
  const images = await HomeImage.find().sort("-createdAt");
  res.json(images);
});

app.put("/api/home-images/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });
    const updateData = { imageUrl: "/uploads/" + req.file.filename };
    const image = await HomeImage.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/home-images/:id", requireAdmin, async (req, res) => {
  await HomeImage.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ====================== EVENTS ======================
app.post("/api/events", requireAdmin, upload.single("image"), async (req, res) => {
  const { title, registerPage, hasForm } = req.body;
  const event = new Event({
    title,
    registerPage,
    hasForm: hasForm === "true",
    imageUrl: req.file ? "/uploads/" + req.file.filename : null,
  });
  await event.save();
  res.json(event);
});

app.get("/api/events", async (req, res) => {
  const events = await Event.find().sort("-createdAt");
  res.json(events);
});

app.put("/api/events/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, registerPage, hasForm } = req.body;
    const updateData = { title, registerPage, hasForm: hasForm === "true" };
    if (req.file) updateData.imageUrl = "/uploads/" + req.file.filename;
    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/events/:id", requireAdmin, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ====================== SPONSORS ======================
app.post(
  "/api/sponsors",
  requireAdmin,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files;
    const sponsor = new Sponsor({
      title: req.body.title,
      logoUrl: files.logo ? "/uploads/" + files.logo[0].filename : null,
      coverUrl: files.cover ? "/uploads/" + files.cover[0].filename : null,
      videoUrl: files.video ? "/uploads/" + files.video[0].filename : null,
    });
    await sponsor.save();
    res.json(sponsor);
  }
);

app.get("/api/sponsors", async (req, res) => {
  const sponsors = await Sponsor.find().sort("-createdAt");
  res.json(sponsors);
});

app.put(
  "/api/sponsors/:id",
  requireAdmin,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const updateData = { title: req.body.title };
      if (files.logo) updateData.logoUrl = "/uploads/" + files.logo[0].filename;
      if (files.cover) updateData.coverUrl = "/uploads/" + files.cover[0].filename;
      if (files.video) updateData.videoUrl = "/uploads/" + files.video[0].filename;
      const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, updateData, { new: true });
      res.json(sponsor);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete("/api/sponsors/:id", requireAdmin, async (req, res) => {
  await Sponsor.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ====================== GALLERY ======================
app.post("/api/gallery", requireAdmin, upload.single("image"), async (req, res) => {
  const gallery = new Gallery({
    title: req.body.title,
    imageUrl: "/uploads/" + req.file.filename,
  });
  await gallery.save();
  res.json(gallery);
});

app.get("/api/gallery", async (req, res) => {
  const gallery = await Gallery.find().sort("-createdAt");
  res.json(gallery);
});

app.put("/api/gallery/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const updateData = { title: req.body.title };
    if (req.file) updateData.imageUrl = "/uploads/" + req.file.filename;
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/gallery/:id", requireAdmin, async (req, res) => {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ====================== REGISTRATIONS ======================
app.post("/api/registrations", async (req, res) => {
  const reg = new Registration({
    eventName: req.body.eventName,
    formData: req.body.formData,
  });
  await reg.save();
  res.json(reg);
});

app.get("/api/registrations", async (req, res) => {
  const regs = await Registration.find().sort("-createdAt");
  res.json(regs);
});

app.delete("/api/registrations/:id", requireAdmin, async (req, res) => {
  await Registration.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ====================== CONTACT ======================
app.post("/api/contact", async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `New Contact Form Submission: ${req.body.subject}`,
      text: `
Name: ${req.body.name}
Email: ${req.body.email}
Phone: ${req.body.phone}
Subject: ${req.body.subject}
Message: ${req.body.message}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Message saved and email sent" });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ error: "Failed to process contact form" });
  }
});

app.get("/api/contact", async (req, res) => {
  const messages = await Contact.find().sort("-createdAt");
  res.json(messages);
});

// ====================== STATIC FILES ======================
app.use(express.static(path.join(__dirname, "public")));

// ====================== SERVER ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});