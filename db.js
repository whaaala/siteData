import mongoose from 'mongoose';
import 'dotenv/config'; 

// --- Mongoose Setup ---
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sitedata'; // Change to your MongoDB URI
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
  wpFeaturedMediaId: Number,
  fbPostId: String,
  fbPostUrl: String,
  // Facebook moderation tracking
  fbModerationStatus: {
    type: String,
    enum: ['pending', 'approved', 'blocked', 'posted', 'failed_to_post', 'skipped_pattern_match', 'error'],
    default: 'pending'
  },
  fbModerationReason: String,
  fbModerationFlags: mongoose.Schema.Types.Mixed,
  fbImageAnalysis: mongoose.Schema.Types.Mixed, // Store image analysis results
  fbModerationDate: {
    type: Date,
    default: Date.now
  },
  // Instagram posting tracking
  igPostId: String, // Instagram feed post ID
  igPostUrl: String,
  igStoryId: String, // Instagram story ID (24-hour story with clickable link)
  igModerationStatus: {
    type: String,
    enum: ['pending', 'approved', 'blocked', 'posted', 'failed_to_post', 'skipped_pattern_match', 'error'],
    default: 'pending'
  },
  igModerationReason: String,
  igModerationFlags: mongoose.Schema.Types.Mixed,
  igImageAnalysis: mongoose.Schema.Types.Mixed,
  igModerationDate: {
    type: Date,
    default: Date.now
  },
  // X (Twitter) posting tracking
  xTweetId: String, // Tweet ID
  xTweetUrl: String, // Tweet URL
  xPostStatus: {
    type: String,
    enum: ['pending', 'posted', 'failed_to_post', 'error'],
    default: 'pending'
  },
  xPostDate: {
    type: Date
  }
});

export const Post = mongoose.model('Post', postSchema);