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
- Make it catchy, clear, and as short as possible while keeping the core meaning and context.
- Tailor it for Nigerian audiences interested in News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, or Gist.
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
        // content: `
        //    Rewrite the following content (${content}) into an original, engaging, and reader-friendly post for Nigerian audiences 
        //    interested in News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, or Gist. 
        //    Make it culturally relevant, locally contextual, and valuable to readers.

        //   AdSense Compliance & Accuracy Rules:
        //   - Create a unique, original version of the content. Do not just paraphrase—expand with added context, 
        //     background, insights, tributes, reactions, and Nigerian relevance where possible
        //   - Accuracy is critical: all figures, statistics, dates, exchange rates, scores, or numerical details must be fact-checked 
        //     and verified against reliable sources before including them. Correct any inconsistencies.
        //   - Do not include adult content, hate speech, violence, misleading claims, sensationalism, or anything discriminatory or illegal. 
        //     Keep the writing respectful, empathetic, helpful, informative, and ethical.
        //   - Use a natural, conversational, and relatable tone, with local/Nigerian examples where appropriate to improve connection 
        //     with readers.
        //   - Include relevant keywords (names, places, events, topics) for SEO, but keep the writing smooth, the flow natural and readable.
        //   - Ensure the content is at least 890 words long for depth and engagement. Expand with extra background details, local or cultural 
        //     context, quotes, eyewitness perspectives, global or regional relevance, or reflections as needed.
        //   - Structure the article clearly with rewritten subheadings (H3 or bold style if needed) and logical flow 
        //     (introduction, background, impact, reactions, conclusion). If the original begins with a heading, rewrite that heading 
        //     as a paragraph instead of a heading.
        //   - Where appropriate, suggest the inclusion of visuals, infographics, or local references to improve user engagement
        //     (but do not insert HTML tags for images).
        //   - End with a call to action or question inviting readers to comment or share opinions.
        //   - Keep the original HTML structure (paragraphs, lists, links, user comments). Do not add <html>, <body>, <h1>, or <h2> tags.
        //   - Maintain the original HTML paragraph structure without adding extra markup.
        //   - Keep the final text clear, polished, error-free, and fully AdSense-compliant.
        //   - Only rewrite headings already in the content, and make them very different and original but if content start with a heading, 
        //     rewrite that heading as a paragraph as it should be treated as a paragraph.
        //   - End with a call to action or a reader question, inviting comments or opinions to encourage engagement.

        // Do NOT include any new titles, headlines, or HTML tags like <html>, <body>, <h1>, or <h2> at the beginning or anywhere in your response. 
        // Do NOT provide explanations or quotes. Only return the rewritten content.
        // THE FINAL REWRITTEN CONTENT MUST BE AT LEAST 890 WORDS LONG.
        // `,
        content: `
             Please rewrite the following content, provided as the variable ${content}, into a fully original, engaging, long-form article tailored primarily for Nigerian readers, with secondary appeal to Ghanaians, broader West Africans, Africans overall, and global audiences. Content may span News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, Cars & Vehicles, Business, Viral/Gist, or other general-interest categories.

🚨 MUST HAVE & MANDATORY (Non-Negotiable)
- Minimum Length: Content must be at least 900 words for depth and engagement.
- Originality: Must be completely distinct in structure, narrative, and expression from the source while preserving integrity and factual accuracy of the subject matter.
- AdSense Compliance: All content must be clear, ethical, informative, safe for all audiences, and fully AdSense-ready. Exclude adult themes, violence, hate, sensationalism, misleading claims, unsafe advice, or policy violations.
- Output: Return only the rewritten content — no commentary, notes, titles, or <html>/<body> tags. Preserve <p> tags and inline formatting only.

✅ Guidelines for AdSense Suitability & Reader Value

Originality & Depth
- Do not paraphrase directly — substantially reframe, expand, and enrich with new insights, analysis, reactions, cultural context, or comparisons.
- Invent a new structure, grouping, or narrative frame (e.g., start with a Lagos story, cultural moment, or fan reaction).
- Replace anecdotes, quotes, or stories from the source with new, original, or locally inspired ones.
- Provide background context, history, and Nigerian/West African perspectives.

Category Depth

📰 News
- Provide Nigerian/West African reactions, explain impact on daily life, politics, or society.
- Fact-check thoroughly; avoid sensationalism.

⚽ Sports
- Always open with a creative local hook: a fan’s perspective, a market scene, or a unique Nigerian setting (e.g., radios blaring in Oshodi market, viewing centers erupting in cheers, or a family gathering around a TV).
- Embed deep local context: describe how the event is experienced in daily Nigerian life (markets, viewing centers, radio, family gatherings, local slang).
- Invent original, realistic quotes or reactions from fans, vendors, or community figures—never copy or adapt from the source.
- Avoid standard news structure. Reorder the narrative, use flashbacks, or frame the story around a local tradition or event.
- Go beyond reporting: add creative storytelling, metaphors, and cultural references (e.g., “the tension in the crowd was as thick as Lagos traffic”).
- Highlight how the match or event impacts daily life, sparks debate, or inspires pride in the community.
- Ensure all stats, match results, and details are fact-checked and accurate.
- Avoid rumors, fake news, or clickbait speculation.
- End with a locally relevant question or call to action to spark discussion (e.g., “Where did you watch the match, and how did your community react?”).

🎬 Entertainment
- Highlight Nollywood, Afrobeats, local celebrities, movies, awards, and cultural events.
- Show how global trends influence or are influenced by West African pop culture.

🍲 Food & Drink
- Completely reimagine recipes — change order, group steps differently, or frame with a local story/tradition.
- Suggest Nigerian/Ghanaian substitutes (suya, akara, shito, plantain, bofrot, kuli-kuli, etc.).
- Add cultural kitchen insights, practical cooking tips, or festive traditions.
- Do not copy flow/structure of the original recipe.

🚗 Cars & Vehicles
- Discuss realities like second-hand imports, okada bans, EV adoption, ride-hailing, fuel economy, African road trips, or car expos.
- Compare Nigerian/Ghanaian trends with global auto culture.

💼 Business
- Cover local/regional markets, entrepreneurship, tech, naira/cedi value, and African trade.
- Relate global business news to Nigerian/West African context.

👗 Lifestyle
- Fashion, beauty, relationships, home, travel, and everyday living.
- Tie in Nigerian/West African trends and practical tips.

🏋️ Health & Fitness
- Focus on locally relevant fitness/wellness tips.
- Attribute traditional remedies as “commonly believed” or “traditionally used,” not as medical fact.
- Avoid unsafe, unverified, or restricted claims.

🔥 Viral/Gist
- Explain why the topic is trending.
- Connect to Nigerian/West African humor, slang, memes, or cultural moments.

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
  return completion.choices[0].message.content.trim()
}
