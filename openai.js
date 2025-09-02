import OpenAI from "openai";
import dotenv from "dotenv"; 

// Load environment variables from .env file
// Ensure you have a .env file with OPENAI_API_KEY set
dotenv.config(); // Load environment variables from .env file

// Initialize OpenAI client with your API key
// Make sure to set your OpenAI API key in the environment variable OPENAI_API_KEY
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Use your environment variable for security
});

/**
 * Rewrites a title using OpenAI GPT.
 * @param {string} title - The original title.
 * @returns {Promise<string>} - The rewritten title.
 */
export async function rewriteTitle(title) {  
  const completion = await openAIClient.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. When rewriting, only return the rewritten title itself. Do not include any explanations, comments, or introductions."
      },
      {
        role: "user",
        content: `Rewrite the title in a short, concise way. Only return the rewritten title itself:\n${title}`
      }
    ]
  });
  return completion.choices[0].message.content.trim();
}

/**
 * Rewrites text content using OpenAI GPT.
 * @param {string} content - The original content.
 * @returns {Promise<string>} - The rewritten content.
 */
export async function rewriteContent(content) {
  const completion = await openAIClient.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that rewrites blog post content to be clear, engaging, and original. Preserve any HTML tags and structure."
      },
      {
        role: "user",
        content: `Completly rewrite the following blog post content. Keep all HTML tags and structure for the position of the images and social media links:\n${content}`
      }
    ]
  });
  return completion.choices[0].message.content.trim();
}
