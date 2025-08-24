import mongoose from 'mongoose';
import 'dotenv/config'; 

// --- Mongoose Setup ---
const mongoUri = process.env.MONGO_URI; // Change to your MongoDB URI
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the schema for storing posts
const postSchema = new mongoose.Schema({
  url: String,
  title: String,
  website: String,
  dateRetrieved: String,
  author: String,
  timePosted: String,
  category: String,
  imageLink: String,
  postDetails: mongoose.Schema.Types.Mixed,
  rewrittenTitle: String,
  originalTitle: String,
  rewrittenDetails: mongoose.Schema.Types.Mixed,
  excerpt: String,
  wpPostId: Number,
  wpPostUrl: String,
  wpFeaturedMediaId: Number
});

export const Post = mongoose.model('Post', postSchema);