import calculateCategoryQuotas from './categoryQuota.js'
import mongoose from 'mongoose';
import { Post } from './db.js'
import { postToWordpressStage } from './publishStage.js'

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function batchPublishForToday() {
  await mongoose.connect(process.env.MONGO_URI)

  // 1. Get all posts scraped today and not yet published
  const todayStr = new Date().toISOString().slice(0, 10)
  const allPosts = await Post.find({
    dateRetrieved: { $gte: new Date(todayStr) },
    published: { $ne: true },
  })

  // 2. Count available posts per category
  const availablePosts = {}
  for (const post of allPosts) {
    const cat = post.category
    availablePosts[cat] = (availablePosts[cat] || 0) + 1
  }

  // 3. Calculate quotas
  const dailyTotal = Math.floor(Math.random() * 31) + 70 // 70–100
  const quotas = calculateCategoryQuotas(availablePosts, dailyTotal)

  // 4. Select posts to publish, interleaving by category
  const postsByCategory = {}
  for (const cat of Object.keys(quotas)) {
    const catPosts = allPosts
      .filter((post) => post.category === cat)
      .slice(0, quotas[cat])
    postsByCategory[cat] = shuffle(catPosts)
  }

  const postsToPublish = []
  let added = true
  while (added) {
    added = false
    for (const cat of Object.keys(quotas)) {
      if (postsByCategory[cat] && postsByCategory[cat].length > 0) {
        postsToPublish.push(postsByCategory[cat].shift())
        added = true
      }
    }
  }

  // 5. Publish, spreading out as needed (e.g., every 10 min)
  for (const post of postsToPublish) {
    await postToWordpressStage(
      post,
      process.env.WORDPRESS_URL,
      process.env.WORDPRESS_USERNAME,
      process.env.WORDPRESS_PASSWORD
    )
    post.published = true
    await post.save()
    await sleep(10 * 60 * 1000) // 10 minutes between posts
  }

  await mongoose.disconnect()
}
// To run this batch publish function, you can uncomment the line below
batchPublishForToday();