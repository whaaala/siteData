import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables from .env file
// Ensure you have a .env file with OPENAI_API_KEY set
dotenv.config() // Load environment variables from .env file

// Initialize OpenAI client with your API key
// Make sure to set your OpenAI API key in the environment variable OPENAI_API_KEY
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use your environment variable for security
})

/**
 * Rewrites a title using OpenAI GPT.
 * @param {string} title - The original title.
 * @returns {Promise<string>} - The rewritten title.
 */
export async function rewriteTitle(title) {
  const completion = await openAIClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. When rewriting, only return the rewritten title itself. Do not include any explanations, comments, or introductions.',
      },
      {
        role: 'user',
        content: `
              Please create 1 engaging and original headline based on the title provided: ${title}. 
              The headline should be catchy, clear, and as short as possible while keeping the core meaning intact. 
              Tailor it for Nigerian audiences interested in News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, or Gist. 
              Avoid copying the original title directly, but naturally include relevant keywords from the original title for SEO purposes. 
              Only return the rewritten headline, with no extra text or explanation.
        `,
      },
    ],
  })
  return completion.choices[0].message.content.trim()
}

/**
 * Rewrites text content using OpenAI GPT.
 * @param {string} content - The original content.
 * @returns {Promise<string>} - The rewritten content.
 */
export async function rewriteContent(content) {
  const completion = await openAIClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that rewrites blog post content to be clear, engaging, and original. Preserve any HTML tags and structure.',
      },
      {
        role: 'user',
        content: `
           Rewrite the following content (${content}) into an original, engaging, and reader-friendly post for Nigerian audiences 
           interested in News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, or Gist. 
           Make it culturally relevant, locally contextual, and valuable to readers.

          AdSense Compliance & Accuracy Rules:
          - Create a unique, original version of the content. Do not simply paraphrase; expand with added context, background, insights, and Nigerian relevance.
          - Accuracy is critical: all figures, statistics, exchange rates, scores, or numerical details must be fact-checked and verified against 
            multiple reliable sources before including them. Correct any inconsistencies.
          - Do not include adult content, hate speech, violence, misleading claims, or anything discriminatory or illegal. Keep it helpful, informative, and ethical.
          - Use a natural, conversational, and relatable tone, with local examples and language.
          - Include relevant keywords (names, places, events, topics) for SEO, but keep the writing smooth and readable.
          - Ensure the content is at least 800 words for depth and engagement. Expand with extra details or local context as needed.
          - The writing must be clear, well-structured, and error-free.
          - End with a call to action or question inviting readers to comment or share opinions.
          - Keep the original HTML structure (paragraphs, lists, links, user comments). Do not add <html>, <body>, <h1>, or <h2> tags.
          - Only rewrite headings already in the content, and make them very different and original but if content start with a heading, rewrite that heading as a paragraph as it should be treated as a paragraph.

        Do NOT include any new titles, headlines, or HTML tags like <html>, <body>, <h1>, or <h2> at the beginning or anywhere in your response. 
        Do NOT provide explanations or quotes. Only return the rewritten content.
        THE FINAL REWRITTEN CONTENT MUST BE AT LEAST 800 WORDS LONG.
        `,
      },
    ],
  })
  return completion.choices[0].message.content.trim()
}
