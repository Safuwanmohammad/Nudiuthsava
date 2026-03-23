require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

const homeImageSchema = new mongoose.Schema({ imageUrl: String });
const HomeImage = mongoose.model('HomeImage', homeImageSchema);

const eventSchema = new mongoose.Schema({ title: String, imageUrl: String });
const Event = mongoose.model('Event', eventSchema);

const sponsorSchema = new mongoose.Schema({ title: String, logoUrl: String, coverUrl: String, videoUrl: String });
const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const gallerySchema = new mongoose.Schema({ title: String, imageUrl: String });
const Gallery = mongoose.model('Gallery', gallerySchema);

async function clear() {
  await mongoose.connect(uri, { family: 4 });
  await HomeImage.deleteMany({});
  await Event.deleteMany({});
  await Sponsor.deleteMany({});
  await Gallery.deleteMany({});
  console.log('✅ Cleared all image-related collections');
  process.exit(0);
}
clear();