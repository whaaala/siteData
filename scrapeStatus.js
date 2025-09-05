import mongoose from 'mongoose';

const scrapeStatusSchema = new mongoose.Schema({
  url: { type: String, unique: true },
  siteVar: String,
  scrapedAt: { type: Date, default: Date.now }
});

export default mongoose.model('ScrapeStatus', scrapeStatusSchema);