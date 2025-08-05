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

// Function to convert content using OpenAI's GPT model
// This function takes content as input and returns the converted content
export async function contentConverter(content) {
  const completion = await openAIClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: `Rewrite the content: ${content}`
      }
    ]
   
  });

  // Return the converted content from the OpenAI response
  // Ensure to handle cases where the response might not contain the expected structure
  return completion.choices[0].message.content;
}
