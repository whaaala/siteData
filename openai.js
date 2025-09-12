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
                - Do NOT remove, move, or alter placeholders like [[EMBED_0]], [[EMBED_1]], etc. Keep them exactly where they appear.
                - Preserve all original HTML tags (<p>, <ul>, <ol>, <li>, <a>, <blockquote>, <iframe>, <div>, <img>, <video>, etc.). Do not move or delete embedded media.

                🚦 Core Rules
                - Minimum MUST be 900 words. If the content is under 900 words, expand with more background, analysis, or local context.
                - Maintain original meaning, facts, and context. Do not add false info or change key details.
                - Must be original, AdSense-safe, neutral, factually accurate, and plagiarism-free.
                - Attribute facts/quotes to credible sources. Use “alleged,” “reportedly,” or “according to” for unverified info.
                - No clickbait, sensationalism, or graphic detail. Use respectful tone for sensitive topics.
                - Always explain Nigerian/West African relevance, and link to global impact when useful.
                - End with BOTH a locally relevant question AND a call to action (e.g., “What’s your view? Drop a comment and follow us for updates.”).

                🚦 Content Quality & Editorial Depth
                - Where possible, add depth by including local perspectives, expert opinions, or quotes from credible sources (real or plausible, e.g., “according to Lagos-based analyst…”).
                - Include relevant data, statistics, or comparisons to make the article more informative for local readers.
                - Present a balanced view: mention challenges, competition, or alternative viewpoints where appropriate, not just positives.
                - Avoid overly promotional tone; aim for editorial value and analysis.

                🚦 Source Attribution & Links
                - Where possible, link directly to official sources, press releases, court documents, or agency reports.
                - Attribute quotes to named individuals (e.g., spokespersons, officials, activists) and include date/source if available.

                🚦 Local Voices & Testimonials
                - Include interviews, quotes, or perspectives from people in affected communities, local experts, or relevant stakeholders.
                - Where appropriate, offer comment from a legal or subject-matter expert to explain implications.

                🚦 Legal, Environmental, or Technical Analysis (if relevant)
                - Clarify legal requirements, how regulations work, and typical consequences for non-compliance.
                - Discuss environmental or social impacts, including remediation or reforms if applicable.

                🚦 Comparative & Historical Data
                - Add context with comparative or historical data (e.g., similar cases, trends, benchmarks from other countries in West Africa or Africa).

                🚦 Balance & Counterpoints
                - Acknowledge challenges, enforcement issues, or possible delays.
                - Consider whether penalties or solutions are sufficient, and present counterpoints or alternative views.

                🚦 SEO & User Engagement Enhancements
                - Use SEO-friendly subheadings, short paragraphs, and bullet lists for clarity.
                - Where possible, add internal links to related content (e.g., similar news, backgrounders, or explainers).
                - Use visuals, charts, or maps if possible (as HTML or placeholders), and ensure images are credited or licensed.

                🚦 Technical & Policy Cleanups
                - Ensure the article includes or references a credible author bio (if available).
                - Confirm images are licensed or credited in the content.
                - Do not include misleading claims or uncredited images.

                🚦 Footer (must appear last, with no text after it)
                Create a custom, interactive footer that is relevant to the content topic and encourages reader engagement.
                - The footer MUST always include a message letting readers know they can get their story posted on the site or sell their story, and if they have a story to share or sell, they should contact us at:
                  Story sales/submissions: <a href="mailto:story@nowahalazone.com"><strong>story@nowahalazone.com</strong></a>
                - If the content is about food, invite readers to share their own recipes or food stories, and mention the food contact email.
                - For news, business, or sensitive topics, encourage readers to share tips, opinions, or stories, and mention the general support or story submission email.
                - For entertainment, sports, or lifestyle, invite readers to comment, share their experiences, or follow on social media.
                - Always include the appropriate contact email(s) and social media links, but introduce them in a way that fits the content context and feels natural and engaging.
                - All social media links MUST include target="_blank" so they open in a new tab.
                - Make the footer conversational and locally relevant.

                  Example (for any article):  
                  "Have a story you want to share or sell? We’d love to hear from you! Email us at <a href='mailto:story@nowahalazone.com'><strong>story@nowahalazone.com</strong></a> to get your story featured or discuss story sales.  
                  For general support, reach out at <a href='mailto:support@nowahalazone.com'><strong>support@nowahalazone.com</strong></a>.  
                  Follow us on <a href='https://www.facebook.com/wahaala.wahaala' target='_blank'><strong>Facebook</strong></a>, <a href='https://x.com/wahaala2' target='_blank'><strong>X (Twitter)</strong></a>, and <a href='https://www.instagram.com/wahaalawahala' target='_blank'><strong>Instagram</strong></a> for more updates!"

                🚦 Safety & SEO
                - Use cautious language: “claims,” “alleges,” “reportedly,” “according to [source].”
                - Include counterpoints, local reactions, or expert analysis where relevant.
                - Ensure smooth flow: Intro → Background → Local impact → Global view → Reactions → Conclusion + CTA.
                - Ensure each section flows logically into the next, using transitional phrases where appropriate.
                - Use SEO-friendly subheadings, short paragraphs, and bullet points for clarity.
                - Vary attribution styles (“according to,” “he noted,” “officials explained”) to avoid repetition.

                Category-Specific Additions:
                - [News] Include Nigerian/West African reactions and explain local impact. Do not use sports, food, or unrelated analogies.
                - [Sports] Open with Nigerian fan culture, viewing centers, or reactions. Attribute opinions to credible voices. Do not use food, business, or unrelated analogies.
                - [Entertainment] Highlight Nollywood, Afrobeats, or African celebrities/events, and connect global trends to local culture. Do not use sports, food, or unrelated analogies.
                - [Food & Drink] Reframe recipes with Nigerian/Ghanaian substitutes or stories. Do not use sports, automotive, or unrelated analogies.
                - [Cars & Vehicles] Focus on local driving, transport issues, fuel, okada/keke, or import policies. Do not use food, sports, or unrelated analogies.
                - [Business] Explain effects on Nigerian consumers, traders, SMEs, and economy. Use local expert commentary. Do not use food, sports, or unrelated analogies.
                - [Lifestyle] Relate tips/trends to everyday West African experiences. Do not use food, sports, or unrelated analogies.
                - [Health & Fitness] Present locally relevant wellness advice, clearly distinguishing traditional beliefs vs. medical facts. Do not use food, sports, or unrelated analogies.
                - [Viral/Gist] Attribute memes/trends properly, note why Nigerians are engaging, and clarify if details are unverified. Do not use food, sports, or unrelated analogies.
                - [Sensitive] Stay strictly factual, respectful, and cautious. Attribute all claims and avoid graphic detail.

                Return only the rewritten content—no extra notes, commentary, or <html>/<body> tags.
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
