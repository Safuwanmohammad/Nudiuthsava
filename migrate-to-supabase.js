require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ===== Schemas (copy from your server.js) =====
const homeImageSchema = new mongoose.Schema({ imageUrl: String, createdAt: Date });
const HomeImage = mongoose.model('HomeImage', homeImageSchema);

const eventSchema = new mongoose.Schema({ title: String, imageUrl: String, hasForm: Boolean, createdAt: Date });
const Event = mongoose.model('Event', eventSchema);

const sponsorSchema = new mongoose.Schema({ title: String, logoUrl: String, coverUrl: String, videoUrl: String, createdAt: Date });
const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const gallerySchema = new mongoose.Schema({ title: String, imageUrl: String, createdAt: Date });
const Gallery = mongoose.model('Gallery', gallerySchema);

// ===== Supabase Setup =====
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const BUCKET = process.env.SUPABASE_BUCKET;

// Helper to upload a local file to Supabase and return public URL
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
    .upload(storagePath, fileBuffer, { contentType: 'image/*' }); // adjust content type as needed

  if (error) {
    console.error(`Upload error for ${filePath}:`, error);
    return null;
  }
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);
  return publicUrlData.publicUrl;
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // --- Home Images ---
  const homeImages = await HomeImage.find();
  for (const img of homeImages) {
    if (img.imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, img.imageUrl); // assumes file is in project root/uploads/
      const newUrl = await uploadLocalFile(localPath, 'home');
      if (newUrl) {
        img.imageUrl = newUrl;
        await img.save();
        console.log(`Updated home image: ${newUrl}`);
      }
    }
  }

  // --- Events ---
  const events = await Event.find();
  for (const ev of events) {
    if (ev.imageUrl && ev.imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, ev.imageUrl);
      const newUrl = await uploadLocalFile(localPath, 'events');
      if (newUrl) {
        ev.imageUrl = newUrl;
        await ev.save();
        console.log(`Updated event ${ev.title}: ${newUrl}`);
      }
    }
  }

  // --- Sponsors ---
  const sponsors = await Sponsor.find();
  for (const sp of sponsors) {
    if (sp.logoUrl && sp.logoUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, sp.logoUrl);
      const newUrl = await uploadLocalFile(localPath, 'sponsors/logos');
      if (newUrl) {
        sp.logoUrl = newUrl;
      }
    }
    if (sp.coverUrl && sp.coverUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, sp.coverUrl);
      const newUrl = await uploadLocalFile(localPath, 'sponsors/covers');
      if (newUrl) {
        sp.coverUrl = newUrl;
      }
    }
    if (sp.videoUrl && sp.videoUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, sp.videoUrl);
      const newUrl = await uploadLocalFile(localPath, 'sponsors/videos');
      if (newUrl) {
        sp.videoUrl = newUrl;
      }
    }
    await sp.save();
    console.log(`Updated sponsor ${sp.title}`);
  }

  // --- Gallery ---
  const galleryItems = await Gallery.find();
  for (const item of galleryItems) {
    if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, item.imageUrl);
      const newUrl = await uploadLocalFile(localPath, 'gallery');
      if (newUrl) {
        item.imageUrl = newUrl;
        await item.save();
        console.log(`Updated gallery item: ${newUrl}`);
      }
    }
  }

  console.log('✅ Migration complete');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});