// seed.js
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ===== Supabase Setup =====
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const BUCKET = process.env.SUPABASE_BUCKET;

// Helper: upload a local file to Supabase and return public URL
async function uploadLocalFile(filePath, folder = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
  const storagePath = folder ? `${folder}/${uniqueName}` : uniqueName;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: 'image/*' }); // adjust for videos

  if (error) {
    console.error(`Upload error for ${filePath}:`, error.message);
    return null;
  }
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);
  return publicUrlData.publicUrl;
}

// ===== Schemas (same as before) =====
const homeImageSchema = new mongoose.Schema({
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const HomeImage = mongoose.model('HomeImage', homeImageSchema);

const eventSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  registerPage: String,
  hasForm: Boolean,
  createdAt: { type: Date, default: Date.now },
});
const Event = mongoose.model('Event', eventSchema);

const sponsorSchema = new mongoose.Schema({
  title: String,
  logoUrl: String,
  coverUrl: String,
  videoUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const gallerySchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const Gallery = mongoose.model('Gallery', gallerySchema);

// ===== Static Data (local paths) =====
const staticHomeImages = [
  { localPath: 'uploads/ashirwad.png', folder: 'home' },
  { localPath: 'uploads/syrus.png', folder: 'home' },
  { localPath: 'uploads/sponsor3.jpg', folder: 'home' },
  { localPath: 'uploads/sponsor4.jpg', folder: 'home' },
];

const staticEvents = [
  {
    title: 'Nudi Nruthya Sambhrama',
    localPath: 'uploads/Nudi Nruthya Sambhrama.jpg',
    folder: 'events',
    hasForm: true,
  },
  {
    title: 'Kannada Short Story Writing',
    localPath: 'uploads/Kannada Short Story writing.jpg',
    folder: 'events',
    hasForm: true,
  },
  {
    title: 'Vidyarthi Kavighosti',
    localPath: 'uploads/kavighosti.jpg',
    folder: 'events',
    hasForm: true,
  },
];

const staticSponsors = [
  {
    title: 'Title Sponsor',
    logoPath: 'uploads/ashirwad.png',
    coverPath: 'uploads/festival.jpg',
    videoPath: 'videos/ashirvad.mp4',
    logoFolder: 'sponsors/logos',
    coverFolder: 'sponsors/covers',
    videoFolder: 'sponsors/videos',
  },
  {
    title: 'Event Supporter',
    logoPath: 'uploads/syrus.png',
    coverPath: 'uploads/festival.jpg',
    videoPath: 'videos/syrus.mp4',
    logoFolder: 'sponsors/logos',
    coverFolder: 'sponsors/covers',
    videoFolder: 'sponsors/videos',
  },
];

const staticGallery = [
  { title: 'Festival Highlight 1', localPath: 'uploads/gallery1.jpg', folder: 'gallery' },
  { title: 'Festival Highlight 2', localPath: 'uploads/gallery2.jpg', folder: 'gallery' },
  // ... add all 9 gallery items
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await HomeImage.deleteMany({});
    await Event.deleteMany({});
    await Sponsor.deleteMany({});
    await Gallery.deleteMany({});
    console.log('🗑️  Cleared existing collections');

    // ---- Home Images ----
    for (const item of staticHomeImages) {
      const url = await uploadLocalFile(item.localPath, item.folder);
      if (url) await HomeImage.create({ imageUrl: url });
    }

    // ---- Events ----
    for (const ev of staticEvents) {
      const url = await uploadLocalFile(ev.localPath, ev.folder);
      if (url) {
        await Event.create({
          title: ev.title,
          imageUrl: url,
          registerPage: '',
          hasForm: ev.hasForm,
        });
      }
    }

    // ---- Sponsors ----
    for (const sp of staticSponsors) {
      const logoUrl = await uploadLocalFile(sp.logoPath, sp.logoFolder);
      const coverUrl = await uploadLocalFile(sp.coverPath, sp.coverFolder);
      const videoUrl = await uploadLocalFile(sp.videoPath, sp.videoFolder);
      await Sponsor.create({
        title: sp.title,
        logoUrl,
        coverUrl,
        videoUrl,
      });
    }

    // ---- Gallery ----
    for (const item of staticGallery) {
      const url = await uploadLocalFile(item.localPath, item.folder);
      if (url) {
        await Gallery.create({
          title: item.title,
          imageUrl: url,
        });
      }
    }

    console.log('📦 Static data inserted successfully');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();