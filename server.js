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
const { createClient } = require('@supabase/supabase-js');
require("dotenv").config();

const app = express();

// ====================== SUPABASE INIT ======================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'uploads';

// ====================== MIDDLEWARE ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent browser caching
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Serve static files from the 'public' folder (images, videos, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// ====================== MONGODB CONNECTION ======================
mongoose
  .connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ====================== SESSION CONFIG ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ client: mongoose.connection.getClient() }),
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
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
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
  registerPage: String,   // external URL (Google Form)
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
  email: String,
  formData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});
registrationSchema.index({ eventName: 1, email: 1 }, { unique: true });
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

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: { type: Date, default: () => Date.now() + 5 * 60 * 1000 },
});
const Otp = mongoose.model("Otp", otpSchema);

// ====================== FILE UPLOAD ======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadFileToSupabase(file, folder = '') {
  if (!file) return null;
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('File upload failed');
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

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
    req.session.save(() => res.json({ success: true, redirect: "/dashboard" }));
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
  try {
    const imageUrl = await uploadFileToSupabase(req.file, 'home');
    const image = new HomeImage({ imageUrl });
    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/home-images", async (req, res) => {
  const images = await HomeImage.find().sort("-createdAt");
  res.json(images);
});

app.put("/api/home-images/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });
    const imageUrl = await uploadFileToSupabase(req.file, 'home');
    const image = await HomeImage.findByIdAndUpdate(req.params.id, { imageUrl }, { new: true });
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/home-images/:id", requireAdmin, async (req, res) => {
  await HomeImage.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ====================== EVENTS (UPDATED) ======================
app.post("/api/events", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, hasForm, registerPage } = req.body;
    let imageUrl = null;
    if (req.file) imageUrl = await uploadFileToSupabase(req.file, 'events');

    const event = new Event({
      title,
      registerPage: registerPage || "",
      hasForm: hasForm === "true" || !!registerPage,
      imageUrl
    });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/events", async (req, res) => {
  const events = await Event.find().sort("-createdAt");
  res.json(events);
});

app.put("/api/events/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, hasForm, registerPage } = req.body;
    const updateData = {
      title,
      registerPage: registerPage || "",
      hasForm: hasForm === "true" || !!registerPage
    };
    if (req.file) updateData.imageUrl = await uploadFileToSupabase(req.file, 'events');

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
app.post("/api/sponsors", requireAdmin,
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "cover", maxCount: 1 }, { name: "video", maxCount: 1 }]),
  async (req, res) => {
    try {
      const files = req.files;
      const logoUrl = files.logo ? await uploadFileToSupabase(files.logo[0], 'sponsors/logos') : null;
      const coverUrl = files.cover ? await uploadFileToSupabase(files.cover[0], 'sponsors/covers') : null;
      const videoUrl = files.video ? await uploadFileToSupabase(files.video[0], 'sponsors/videos') : null;
      const sponsor = new Sponsor({ title: req.body.title, logoUrl, coverUrl, videoUrl });
      await sponsor.save();
      res.json(sponsor);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get("/api/sponsors", async (req, res) => {
  const sponsors = await Sponsor.find().sort("-createdAt");
  res.json(sponsors);
});

app.put("/api/sponsors/:id", requireAdmin,
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "cover", maxCount: 1 }, { name: "video", maxCount: 1 }]),
  async (req, res) => {
    try {
      const updateData = { title: req.body.title };
      const files = req.files;
      if (files.logo) updateData.logoUrl = await uploadFileToSupabase(files.logo[0], 'sponsors/logos');
      if (files.cover) updateData.coverUrl = await uploadFileToSupabase(files.cover[0], 'sponsors/covers');
      if (files.video) updateData.videoUrl = await uploadFileToSupabase(files.video[0], 'sponsors/videos');
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
  try {
    const imageUrl = await uploadFileToSupabase(req.file, 'gallery');
    const gallery = new Gallery({ title: req.body.title, imageUrl });
    await gallery.save();
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/gallery", async (req, res) => {
  const gallery = await Gallery.find().sort("-createdAt");
  res.json(gallery);
});

app.put("/api/gallery/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const updateData = { title: req.body.title };
    if (req.file) updateData.imageUrl = await uploadFileToSupabase(req.file, 'gallery');
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

// ====================== OTP ENDPOINTS (Email) ======================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email address required" });

  await Otp.deleteMany({ email });

  const otp = generateOTP();
  const newOtp = new Otp({ email, otp });
  await newOtp.save();

  console.log(`OTP for ${email}: ${otp}`);

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Nudi Utsava Registration",
      text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.json({ message: "OTP sent (check console for demo mode)" });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  const record = await Otp.findOne({ email, otp });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  req.session.verifiedEmail = email;
  res.json({ success: true });
});

// ====================== REGISTRATIONS ======================
app.post("/api/registrations", async (req, res) => {
  const { eventName, formData } = req.body;

  if (!req.session.verifiedEmail || req.session.verifiedEmail !== formData.studentEmail) {
    return res.status(403).json({ error: "Email not verified via OTP" });
  }

  const existing = await Registration.findOne({
    eventName: eventName,
    email: formData.studentEmail
  });

  if (existing) {
    return res.status(409).json({ error: "This email is already registered for this event." });
  }

  delete req.session.verifiedEmail;

  const reg = new Registration({
    eventName,
    email: formData.studentEmail,
    formData
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
    console.error("❌ Contact error:", err);
    res.status(500).json({ error: "Failed to process contact form", details: err.message });
  }
});

app.get("/api/contact", async (req, res) => {
  const messages = await Contact.find().sort("-createdAt");
  res.json(messages);
});

// ====================== SERVER ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;