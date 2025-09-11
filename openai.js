import OpenAI from 'openai'
import dotenv from 'dotenv'
import { extractEmbeds, reinsertEmbeds } from './embedUtils.js' 

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
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. When rewriting, only return the rewritten title itself. Do not include any explanations, comments, or introductions.',
      },
      {
        role: 'user',
        content: `
            Please create 1 engaging and fully original headline that is **very different** in structure, wording, and style from the original title provided: ${title}.
            - The headline must not copy or closely paraphrase the source title.
            - Make it as short and punchy as possible for SEO/discovery, while keeping it catchy, clear, and contextually accurate.
            - Use relevant keywords from the original title for SEO, but do not mimic the original phrasing.
            - If the original title is a recommendation, claim, or call to action (e.g., "urges," "calls for," "asks," "recommends"), clarify that in the headline (e.g., "NCAA Urges Airlines…", "NCAA Calls for…", "NCAA Recommends…").
            - If the original title makes a claim or presents an opinion, tone down the headline to clarify that it is a claim or opinion, not an established fact (e.g., use words like "claims," "reportedly," "is said to be").
            - Tailor it primarily for Nigerian readers, with secondary appeal to Ghanaians, broader West Africans, Africans overall, and global audiences.
            - Only return the rewritten headline, with no extra text or explanation.
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
   // Step 1: Extract embeds and replace with placeholders
  const { contentWithPlaceholders, embeds } = extractEmbeds(content);


  const completion = await openAIClient.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that rewrites blog post content to be clear, engaging, and original. Preserve any HTML tags and structure.',
      },
      {
        role: 'user',
        content: `
            Please rewrite the following content, provided as the variable ${contentWithPlaceholders}, into a fully original, engaging, long-form article for Nigerian readers (with secondary appeal to Ghanaians, West Africans, Africans, and global audiences). Content may be News, Entertainment, Sports, Lifestyle, Health, Food, Cars, Business, Viral/Gist, or general interest.

            IMPORTANT: 
            - Do NOT remove, move, or alter any placeholders like [[EMBED_0]], [[EMBED_1]], etc. Leave all placeholders exactly where they appear in the input.
            - Preserve all original HTML tags and structure, including <p>, <ul>, <ol>, <li>, <a>, <blockquote>, <iframe>, <div>, <img>, <video>, and any other tags present in the source. Do NOT remove, move, or alter the position of any embedded social media, video, or image HTML code.

            🚦 Core Rules (Apply to All Content)
            - Minimum 900 words, original structure and narrative, AdSense-safe, and factually accurate.
            - Attribute all facts, quotes, and claims to credible sources. If unverified, state as “alleged,” “reportedly,” or “according to sources.”
            - Avoid sensationalism, clickbait, or emotionally charged language unless directly quoted and attributed.
            - Use neutral, respectful tone, especially for sensitive topics. Avoid graphic detail about death, suffering, or betrayal.
            - Always include local context and relevance for Nigerian/West African readers.
            - For global news, relate the story to how it could affect local readers, markets, or daily life.
            - End with a locally relevant question or call to action.
            - At the end, include contact info in this format (each on its own line or paragraph):
              Food inquiries: <a href="mailto:food@nowahalazone.com"><strong>food@nowahalazone.com</strong></a>
              General support: <a href="mailto:support@nowahalazone.com"><strong>support@nowahalazone.com</strong></a>
              Story sales/submissions: <a href="mailto:story@nowahalazone.com"><strong>story@nowahalazone.com</strong></a>
              (Never use source emails.)
            - Then add:
              Follow us on <a href="https://www.facebook.com/wahaala.wahaala"><strong>Facebook</strong></a><br>
              Follow us on <a href="https://x.com/wahaala2"><strong>X (Twitter)</strong></a><br>
              Follow us on <a href="https://www.instagram.com/wahaalawahala"><strong>Instagram</strong></a>

            🚦 AdSense Safety & Robustness (Mandatory for All Content)
            - Use precise, cautious, and neutral language for all claims and reactions. Use words like “alleges,” “claims,” “says,” “according to [source],” rather than stating as fact.
            - Attribute all claims, quotes, and strong statements to specific, credible sources (e.g., “according to Fayose on [platform],” “as reported by [news outlet],” “data from [source]”). If data is not public, clearly state this.
            - Always include responses or counterpoints from those who disagree, rebut, or provide alternative perspectives (e.g., critics, community leaders, legal/political analysts, affected groups).
            - Provide context: include historical data, relevant facts, or constitutional provisions to help readers understand the background and significance of the claim.
            - Avoid broad, absolute statements—use estimates, ranges, or qualifiers (e.g., “reportedly,” “is believed to,” “sources suggest”) unless facts are independently verified.
            - Tone down headlines and body text to clarify when something is a claim or opinion, not an established fact (e.g., “claims,” “reportedly,” “is said to be”).
            - Avoid sensationalist, provocative, or misleading language. Do not present unverified or comparative assertions as fact.
            - Avoid shaming, stereotyping, or insulting language toward any group or individual. Never suggest ethnic superiority or exclusion. Focus on commentary and analysis, not judgment.
            - Maintain a neutral, balanced tone and avoid bias toward one viewpoint. Encourage respectful discourse.
            - Add cultural, ethical, or social reflections where relevant—explain why the issue is sensitive, and encourage thoughtful, constructive discussion.
            - End with a reflective, constructive engagement question that invites readers to share their views (e.g., “What do you think about ethnic representation in Nigerian leadership—has it been fair? Share your view.”).
            - Ensure all disclaimers and attributions are clear, especially for controversial or comparative claims.

            🚦 Readability, Structure, Visuals & SEO (Mandatory for All Content)
            - Avoid repetition: Vary attributions and synonyms for sources (e.g., alternate “according to,” “he emphasized,” “officials noted,” “stakeholders said,” etc.).
            - Organize the article for smooth flow: Start with the main directive or news, then stakeholder reactions, passenger rights, infrastructure issues, global comparisons, and forward outlook.
            - Make all subheadings SEO-rich and engaging, using relevant keywords and clear, punchy language. Subheadings must naturally include target keywords from the article’s main topic for better scannability and SEO.
            - Break up long paragraphs for easier online reading.
            - Use bullet points or numbered lists for key regulatory changes, meeting highlights, or major complaints/issues where appropriate.
            - Where possible, find and insert actual free-to-use (copyright-safe, Creative Commons, or public domain) images from the web that fit the subject matter. Only use images that are allowed for reuse (e.g., Unsplash, Wikimedia Commons, Pexels, etc.), and insert the actual <img> HTML tag with the correct src and credit in the rewritten content. Do not suggest images—only include them if they are truly free to use and allowed for this purpose. If no suitable image is available, do not add any image or suggestion. Never move, remove, or alter any placeholders like [[EMBED_0]]—leave them exactly where they appear in the input, and make sure none of the images you add (if any) are in conflict with any placeholders.
            - Ensure the content is easy to scan, with clear sections, logical progression, and visual breaks where possible.

            Category-Specific Additions:
            - [News] Add Nigerian/West African reactions and explain local impact. Do not use sports, food, or unrelated analogies.
            - [Sports] Open with a local fan scene or viewing center. Attribute all reactions to real or plausible sources. Use creative, locally relevant storytelling. Ensure stats and match details are accurate. Do not use food, business, or unrelated analogies.
            - [Entertainment] Highlight Nollywood, Afrobeats, or local celebrities/events. Show how global trends connect to West African pop culture. Do not use sports, food, or unrelated analogies.
            - [Food & Drink] Reimagine recipes with local ingredients or stories. Suggest Nigerian/Ghanaian substitutes. Do not use sports, automotive, or unrelated analogies.
            - [Cars & Vehicles] Focus on local driving culture, trends, or issues (e.g., okada bans, fuel, imports). Compare with global trends only if relevant. Do not use food, sports, or unrelated analogies.
            - [Business] Explain what the news means for everyday Nigerians or local businesses. Use quotes from local analysts, business owners, or consumers. Do not use food, sports, or unrelated analogies.
            - [Lifestyle] Tie in Nigerian/West African trends and practical tips for daily life. Do not use food, sports, or unrelated analogies.
            - [Health & Fitness] Focus on locally relevant wellness tips. Attribute traditional remedies as “commonly believed,” not medical fact. Do not use food, sports, or unrelated analogies.
            - [Viral/Gist] Attribute all trends or memes to their source. No rumors as fact—if unverified, state as “alleged” or “widely reported.” Explain why it’s trending locally. Do not use food, sports, or unrelated analogies.
            - [Sensitive] Be especially cautious, neutral, and respectful. Never publish unverified, defamatory, or graphic content. Attribute all claims and avoid speculation.

            Structure: Introduction → Background → Local/Regional Context → Global Angle → Reactions → Conclusion with engagement question.

            Return only the rewritten content—no commentary, notes, or <html>/<body> tags. Preserve <p> tags and inline formatting only.
          `,
      },
    ],
  })

    // Step 3: Reinsert embeds back into the rewritten content
  let rewrittenWithEmbeds = completion.choices[0].message.content.trim();

  // Error handling: Check for missing placeholders
  embeds.forEach((embed, i) => {
    const placeholder = `[[EMBED_${i}]]`;
    if (!rewrittenWithEmbeds.includes(placeholder)) {
      console.warn(`[Embed Warning] Placeholder ${placeholder} is missing in AI output. Embed may be lost or misplaced.`);
    }
  });

  // Error handling: Check for extra placeholders (AI added or failed to use some)
  const unreplaced = rewrittenWithEmbeds.match(/\[\[EMBED_\d+\]\]/g);
  if (unreplaced) {
    console.warn(`[Embed Warning] Unused or extra placeholders found in AI output: ${unreplaced.join(', ')}`);
  }

  // Reinsert embeds
  rewrittenWithEmbeds = reinsertEmbeds(rewrittenWithEmbeds, embeds);

  return rewrittenWithEmbeds;
}
