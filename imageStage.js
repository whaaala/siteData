import { Post } from './db.js'
import { fixAndUploadBrokenImages } from './fixImages.js'


export async function uploadImagesStage(wordpressUrl, username, password) {
  const post = await Post.findOne({ processingStage: 'rewritten' })
  if (!post) return

  const processedContent = await fixAndUploadBrokenImages(
    post.rewrittenDetails,
    wordpressUrl,
    username,
    password
  )

  post.processedContent = processedContent
  post.processingStage = 'images_uploaded'
  await post.save()
}