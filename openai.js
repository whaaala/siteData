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
- Make it as short as possible without losing catchiness, clarity, or relevance.
- Ensure it is catchy, clear, and contextually accurate.
- Tailor it primarily for Nigerian readers, with secondary appeal to Ghanaians, broader West Africans, Africans overall, and global audiences.
- Naturally include relevant keywords from the original title for SEO, but do not mimic the original phrasing.
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
          Please rewrite the following content, provided as the variable ${contentWithPlaceholders}, into a fully original, engaging, long-form article tailored primarily for Nigerian readers, with secondary appeal to Ghanaians, broader West Africans, Africans overall, and global audiences. Content may span News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, Cars & Vehicles, Business, Viral/Gist, or other general-interest categories.

            IMPORTANT: Do NOT remove, move, or alter any placeholders like [[EMBED_0]], [[EMBED_1]], etc. Only rewrite the text content. Leave all placeholders exactly where they appear in the input.

🚦 TOPIC & CATEGORY ALIGNMENT (Critical)
- Before rewriting, carefully identify the main topic, purpose, and category of the source content (e.g., automotive, food, sports, business, health, etc.).
- All analogies, local hooks, and cultural references must be directly relevant and natural for the specific topic and audience.
  - For example: Use automotive analogies and practical car-owner stories for car/vehicle content; use food/cooking references only for food/recipe content; use sports/fan stories only for sports content.
- Do NOT use generic or mismatched cultural hooks (e.g., do not start a car repair article with a food or market scene).
- Ensure the introduction, structure, and all examples are aligned with the subject matter and meet the expectations of readers seeking information on that topic.
- The rewritten article must provide clear, accurate, and practical value for readers interested in the main topic.

🚨 MUST HAVE & MANDATORY (Non-Negotiable)
- Minimum Length: Content must be at least 900 words for depth and engagement.
- Originality: Must be completely distinct in structure, narrative, and expression from the source while preserving integrity and factual accuracy of the subject matter.
- AdSense Compliance: All content must be clear, ethical, informative, safe for all audiences, and fully AdSense-ready. Exclude adult themes, violence, hate, sensationalism, misleading claims, unsafe advice, or policy violations.
- Output: Return only the rewritten content — no commentary, notes, titles, or <html>/<body> tags. Preserve <p> tags and inline formatting only.

✅ HTML, Social Media, Video & Image Embeds
- **Preserve all original HTML structure, including <p>, <ul>, <ol>, <li>, <a>, <blockquote>, <iframe>, <div>, <img>, <video>, and any other tags present in the source.**
- **Do NOT remove, move, or alter the position of any embedded social media links, widgets, videos, or images (such as Twitter, Instagram, Facebook, TikTok, YouTube, <img>, <video>, etc. embeds).**
- **Keep all embedded social media, video, and image HTML code exactly where it appears in the original content.**
- Rewrite only the text content, not the HTML structure or the placement of embeds, videos, or images.

✅ Guidelines for AdSense Suitability & Reader Value

Originality & Depth
- Do not paraphrase directly — substantially reframe, expand, and enrich with new insights, analysis, reactions, cultural context, or comparisons.
- Invent a new structure, grouping, or narrative frame that fits the topic and audience.
- Replace anecdotes, quotes, or stories from the source with new, original, or locally inspired ones.
- Provide background context, history, and Nigerian/West African perspectives.

Category-Specific Instructions

📰 News
- Use only news-relevant local hooks (e.g., community reactions, local impact, or political/social context).
- Provide Nigerian/West African reactions, explain impact on daily life, politics, or society.
- Fact-check thoroughly; avoid sensationalism.
- Do not use sports, food, or unrelated analogies.

⚽ Sports
- Use only sports-relevant local hooks (e.g., fan stories, viewing centers, local rivalries).
- Always open with a creative local hook: a fan’s perspective, a market scene, or a unique Nigerian setting (e.g., radios blaring in Oshodi market, viewing centers erupting in cheers, or a family gathering around a TV).
- Embed deep local context: describe how the event is experienced in daily Nigerian life (markets, viewing centers, radio, family gatherings, local slang).
- Invent original, realistic quotes or reactions from fans, vendors, or community figures—never copy or adapt from the source.
- Avoid standard news structure. Reorder the narrative, use flashbacks, or frame the story around a local tradition or event.
- Go beyond reporting: add creative storytelling, metaphors, and cultural references (e.g., “the tension in the crowd was as thick as Lagos traffic”).
- Highlight how the match or event impacts daily life, sparks debate, or inspires pride in the community.
- Ensure all stats, match results, and details are fact-checked and accurate.
- Avoid rumors, fake news, or clickbait speculation.
- End with a locally relevant question or call to action to spark discussion (e.g., “Where did you watch the match, and how did your community react?”).
- Do not use food, business, or unrelated analogies.

🎬 Entertainment
- Use only entertainment-relevant hooks (e.g., Nollywood, Afrobeats, celebrity stories, cultural events).
- Highlight Nollywood, Afrobeats, local celebrities, movies, awards, and cultural events.
- Show how global trends influence or are influenced by West African pop culture.
- Do not use sports, food, or unrelated analogies.

🍲 Food & Drink
- Use only food/cooking-relevant hooks (e.g., kitchen stories, festive meals, local ingredients).
- Completely reimagine recipes — change order, group steps differently, or frame with a local story/tradition.
- Suggest Nigerian/Ghanaian substitutes (suya, akara, shito, plantain, bofrot, kuli-kuli, etc.).
- Add cultural kitchen insights, practical cooking tips, or festive traditions.
- Do not copy flow/structure of the original recipe.
- Do not use sports, automotive, or unrelated analogies.

🚗 Cars & Vehicles
- Use only automotive-relevant hooks (e.g., road trips, mechanic stories, local driving culture).
- Discuss realities like second-hand imports, okada bans, EV adoption, ride-hailing, fuel economy, African road trips, or car expos.
- Compare Nigerian/Ghanaian trends with global auto culture.
- Provide practical, accurate, and technical value for car owners or enthusiasts.
- Do not use food, sports, or unrelated analogies.

💼 Business
- Use only business/economy-relevant hooks (e.g., market stories, entrepreneur journeys, local trade).
- Cover local/regional markets, entrepreneurship, tech, naira/cedi value, and African trade.
- Relate global business news to Nigerian/West African context.
- Do not use food, sports, or unrelated analogies.

👗 Lifestyle
- Use only lifestyle-relevant hooks (e.g., fashion, beauty, travel, relationships, daily living).
- Fashion, beauty, relationships, home, travel, and everyday living.
- Tie in Nigerian/West African trends and practical tips.
- Do not use food, sports, or unrelated analogies.

🏋️ Health & Fitness
- Use only health/wellness-relevant hooks (e.g., local fitness routines, wellness stories, community health).
- Focus on locally relevant fitness/wellness tips.
- Attribute traditional remedies as “commonly believed” or “traditionally used,” not as medical fact.
- Avoid unsafe, unverified, or restricted claims.
- Do not use food, sports, or unrelated analogies.

🔥 Viral/Gist
- Use only viral/trending-relevant hooks (e.g., social media trends, memes, local humor).
- Explain why the topic is trending.
- Connect to Nigerian/West African humor, slang, memes, or cultural moments.
- Do not use food, sports, or unrelated analogies.

✅ Visual Suggestions (No HTML)
- Suggest styled photos, infographics, or cultural shots (markets, traffic, streetwear, suya grills, football fans, kitchens, memes).

✅ Contact Details (Mandatory Format)
Food inquiries → <a href="mailto:food@nowahalazone.com"><strong>food@nowahalazone.com</strong></a>
General support → <a href="mailto:support@nowahalazone.com"><strong>support@nowahalazone.com</strong></a>
Story sales/submissions → <a href="mailto:story@nowahalazone.com"><strong>story@nowahalazone.com</strong></a>
(Never use source emails. Each email must appear on its own line or in a separate paragraph and stand out clearly.)

✅ Structure & Flow
- Logical order: Introduction → Background → Local/Regional Context → Global Angle → Reactions → Conclusion with engagement question.
- Headings must be rewritten fresh and original. If the source begins with a heading, start with an opening paragraph instead.

✅ Engagement & Reader Action
- End with a clear call to action or locally relevant question to invite comments, opinions, or sharing.
- Remind readers that NowahalaZone buys stories — invite submissions to story@nowahalazone.com.

🔑 Requirement:
The rewritten content must be substantially distinct in structure, narrative, and expression from the source, while retaining factual accuracy. It must always be polished, factually reliable, AdSense-ready, and valuable to readers (Nigerian first, then Ghanaian, then West African, African, and global).

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
