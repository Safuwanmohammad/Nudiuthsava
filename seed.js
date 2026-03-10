// seed.js
const mongoose = require('mongoose');
require('dotenv').config();

// ===== Schemas (same as server.js) =====
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

// ===== Static data =====

// Home Slider Images (from your index.html static slides)
const staticHomeImages = [
  { imageUrl: '/uploads/ashirwad.png' },
  { imageUrl: '/uploads/syrus.png' },
  { imageUrl: '/uploads/sponsor3.jpg' },
  { imageUrl: '/uploads/sponsor4.jpg' },
];

const staticEvents = [
  {
    title: 'Nudi Nruthya Sambhrama',
    imageUrl: '/uploads/Nudi Nruthya Sambhrama.jpg',
    registerPage: 'forms/nudi-nruthya.html',
    hasForm: true
  },
  {
    title: 'Kannada Short Story Writing',
    imageUrl: '/uploads/Kannada Short Story writing.jpg',
    registerPage: 'forms/short-story.html',
    hasForm: true
  },
  {
    title: 'Vidyarthi Kavighosti',
    imageUrl: '/uploads/kavighosti.jpg',
    registerPage: 'forms/kavighosti.html',
    hasForm: true
  }
];

const staticSponsors = [
  {
    title: 'Title Sponsor',
    logoUrl: '/uploads/ashirwad.png',
    coverUrl: '/uploads/festival.jpg',
    videoUrl: '/videos/ashirvad.mp4'
  },
  {
    title: 'Event Supporter',
    logoUrl: '/uploads/syrus.png',
    coverUrl: '/uploads/festival.jpg',
    videoUrl: '/videos/syrus.mp4'
  }
];

const staticGallery = [
  { title: 'Festival Highlight 1', imageUrl: '/uploads/gallery1.jpg' },
  { title: 'Festival Highlight 2', imageUrl: '/uploads/gallery2.jpg' },
  { title: 'Festival Highlight 3', imageUrl: '/uploads/gallery3.jpg' },
  { title: 'Cultural Performance 1', imageUrl: '/uploads/gallery4.jpg' },
  { title: 'Cultural Performance 2', imageUrl: '/uploads/gallery5.jpg' },
  { title: 'Cultural Performance 3', imageUrl: '/uploads/gallery6.jpg' },
  { title: 'Competition Moment 1', imageUrl: '/uploads/gallery7.jpg' },
  { title: 'Competition Moment 2', imageUrl: '/uploads/gallery8.jpg' },
  { title: 'Competition Moment 3', imageUrl: '/uploads/gallery9.jpg' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nudiutsava');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await HomeImage.deleteMany({});
    await Event.deleteMany({});
    await Sponsor.deleteMany({});
    await Gallery.deleteMany({});
    console.log('🗑️  Cleared existing collections');

    // Insert static data
    await HomeImage.insertMany(staticHomeImages);
    await Event.insertMany(staticEvents);
    await Sponsor.insertMany(staticSponsors);
    await Gallery.insertMany(staticGallery);

    console.log('📦 Static data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();