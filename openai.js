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
//         content: `
//           Please rewrite the following content, provided as the variable ${contentWithPlaceholders}, into a fully original, engaging, long-form article tailored primarily for Nigerian readers, with secondary appeal to Ghanaians, broader West Africans, Africans overall, and global audiences. Content may span News, Entertainment, Sports, Lifestyle, Health & Fitness, Food & Drink, Cars & Vehicles, Business, Viral/Gist, or other general-interest categories.

//             IMPORTANT: Do NOT remove, move, or alter any placeholders like [[EMBED_0]], [[EMBED_1]], etc. Only rewrite the text content. Leave all placeholders exactly where they appear in the input.

// 🚦 TOPIC & CATEGORY ALIGNMENT (Critical)
// - Before rewriting, carefully identify the main topic, purpose, and category of the source content (e.g., automotive, food, sports, business, health, etc.).
// - All analogies, local hooks, and cultural references must be directly relevant and natural for the specific topic and audience.
//   - For example: Use automotive analogies and practical car-owner stories for car/vehicle content; use food/cooking references only for food/recipe content; use sports/fan stories only for sports content.
// - Do NOT use generic or mismatched cultural hooks (e.g., do not start a car repair article with a food or market scene).
// - Ensure the introduction, structure, and all examples are aligned with the subject matter and meet the expectations of readers seeking information on that topic.
// - The rewritten article must provide clear, accurate, and practical value for readers interested in the main topic.

// 🚨 MUST HAVE & MANDATORY (Non-Negotiable)
// - Minimum Length: Content must be at least 900 words for depth and engagement.
// - Originality: Must be completely distinct in structure, narrative, and expression from the source while preserving integrity and factual accuracy of the subject matter.
// - AdSense Compliance: All content must be clear, ethical, informative, safe for all audiences, and fully AdSense-ready. Exclude adult themes, violence, hate, sensationalism, misleading claims, unsafe advice, or policy violations.
// - Output: Return only the rewritten content — no commentary, notes, titles, or <html>/<body> tags. Preserve <p> tags and inline formatting only.

// ✅ HTML, Social Media, Video & Image Embeds
// - **Preserve all original HTML structure, including <p>, <ul>, <ol>, <li>, <a>, <blockquote>, <iframe>, <div>, <img>, <video>, and any other tags present in the source.**
// - **Do NOT remove, move, or alter the position of any embedded social media links, widgets, videos, or images (such as Twitter, Instagram, Facebook, TikTok, YouTube, <img>, <video>, etc. embeds).**
// - **Keep all embedded social media, video, and image HTML code exactly where it appears in the original content.**
// - Rewrite only the text content, not the HTML structure or the placement of embeds, videos, or images.

// ✅ Guidelines for AdSense Suitability & Reader Value

// Originality & Depth
// - Do not paraphrase directly — substantially reframe, expand, and enrich with new insights, analysis, reactions, cultural context, or comparisons.
// - Invent a new structure, grouping, or narrative frame that fits the topic and audience.
// - Replace anecdotes, quotes, or stories from the source with new, original, or locally inspired ones.
// - Provide background context, history, and Nigerian/West African perspectives.

//  Sourcing, Fact-Checking & Neutrality (Critical for AdSense & Credibility)
// - Always attribute facts, quotes, or claims to reputable sources (news outlets, official statements, interviews, or documents). If a claim cannot be verified, clearly state it as unconfirmed or widely reported, and avoid presenting it as fact.
// - Provide clear evidence for any “strong reasons” or controversial statements. Avoid vague language—if a source cites “lack of transparency” or “policy changes,” include the specific quote or reference.
// - Ensure all reporting is balanced: if possible, include counterpoints, official statements, or perspectives from multiple sides (e.g., government, affected parties, independent analysts).
// - Avoid sensationalism: do not use clickbait headlines, exaggeration, or emotionally charged language. Stick to what is confirmed and verifiable.
// - Maintain a neutral, factual, and respectful tone throughout. Avoid rumor, speculation, or unverified claims.
// - For policy, legal, or sensitive topics, provide cultural or procedural context and end with a thoughtful, locally relevant question for readers.

// ✅ Context, Local Relevance & Engagement (Mandatory for All Content)
// - Always highlight if a news event or ranking is temporary, brief, or subject to change. Attribute such details to sources (e.g., “according to Bloomberg’s index, Ellison briefly overtook Musk…”).
// - Add contextual analysis: Briefly explain why the event or trend matters, what’s driving it, and how it fits into broader global or regional dynamics.
// - For all global news, include a local or West African perspective: Relate the story to how it could affect Nigerian, Ghanaian, or West African readers, markets, businesses, or daily life.
// - Embed user engagement: End with a compelling, locally relevant question or call to action that invites readers to share their thoughts, predictions, or experiences.
// - Ensure a neutral, fact-based tone: Avoid exaggeration, clickbait, or unqualified claims. Attribute all rankings, valuations, or predictions to their sources.

// ✅ Accuracy, Attribution & Engagement (Mandatory for All Content)
// - Attribute all quotes, reactions, or strong statements (e.g., “coach fumes,” “boss outraged”) to credible sources (named news outlets, official statements, or direct interviews). Do not invent or exaggerate reactions; if a reaction is widely reported but not directly quoted, state it as “reportedly” or “according to [source].”
// - Avoid sensationalist or dramatic language unless it is directly supported by a reputable source. Do not use words like “shocking,” “outrage,” or “fumes” unless they are in a direct quote or clearly attributed.
// - For controversial or disputed events (e.g., referee decisions, protests), present both sides or perspectives, and avoid taking a side. Clearly state if an outcome is disputed or under review.
// - Always include local commentary, fan reactions, or cultural context—especially for sports and entertainment. Relate the story to how it is discussed or experienced in Nigeria, Ghana, or West Africa.
// - End with a locally relevant question or call to action that invites readers to weigh in (e.g., “Do you think the referee made the right call?” “How did fans in your area react?”).

// ✅ Verification, Attribution & Sensitive Content (Mandatory for All Content)
// - Confirm and attribute all facts, claims, or quotes to credible sources (e.g., local newspapers, police reports, court documents, or named family/community sources). If a claim cannot be verified, state it as “alleged,” “reportedly,” or “according to sources,” and never present it as established fact.
// - Use cautious, neutral language for all sensitive or controversial topics. Always say “alleged affair,” “reportedly,” or “according to sources” until legally established.
// - Tone down sensational phrasing: Avoid dramatic words like “shock,” “scandal,” or “outrage” in titles or body unless directly quoted from a reputable source. Use milder, factual language (e.g., “during ongoing affair case”).
// - Avoid graphic detail about death, suffering, or betrayal. Focus on emotional impact, societal reaction, and what is verifiable.
// - Include cultural context and reader sensitivity: Show how similar cases are handled locally, what support exists (legal, social, emotional), and how the community responds.
// - End with a thoughtful, sensitive question or reflection to invite reader engagement (e.g., “How do communities handle grief and betrayal together? Have you witnessed something similar? Share your story sensitively.”).
// - Never publish unverified rumors, defamatory statements, or content that could harm individuals or families.

// Category-Specific Instructions

// 📰 News
// - Use only news-relevant local hooks (e.g., community reactions, local impact, or political/social context).
// - Provide Nigerian/West African reactions, explain impact on daily life, politics, or society.
// - Fact-check thoroughly; avoid sensationalism.
// - Do not use sports, food, or unrelated analogies.

// ⚽ Sports
// - Use only sports-relevant local hooks (e.g., fan stories, viewing centers, local rivalries).
// - Always open with a creative local hook: a fan’s perspective, a market scene, or a unique Nigerian setting (e.g., radios blaring in Oshodi market, viewing centers erupting in cheers, or a family gathering around a TV).
// - Embed deep local context: describe how the event is experienced in daily Nigerian life (markets, viewing centers, radio, family gatherings, local slang).
// - Invent original, realistic quotes or reactions from fans, vendors, or community figures—never copy or adapt from the source.
// - Avoid standard news structure. Reorder the narrative, use flashbacks, or frame the story around a local tradition or event.
// - Go beyond reporting: add creative storytelling, metaphors, and cultural references (e.g., “the tension in the crowd was as thick as Lagos traffic”).
// - Highlight how the match or event impacts daily life, sparks debate, or inspires pride in the community.
// - Ensure all stats, match results, and details are fact-checked and accurate.
// - Avoid rumors, fake news, or clickbait speculation.
// - End with a locally relevant question or call to action to spark discussion (e.g., “Where did you watch the match, and how did your community react?”).
// - Do not use food, business, or unrelated analogies.

// 🎬 Entertainment
// - Use only entertainment-relevant hooks (e.g., Nollywood, Afrobeats, celebrity stories, cultural events).
// - Highlight Nollywood, Afrobeats, local celebrities, movies, awards, and cultural events.
// - Show how global trends influence or are influenced by West African pop culture.
// - Do not use sports, food, or unrelated analogies.

// 🍲 Food & Drink
// - Use only food/cooking-relevant hooks (e.g., kitchen stories, festive meals, local ingredients).
// - Completely reimagine recipes — change order, group steps differently, or frame with a local story/tradition.
// - Suggest Nigerian/Ghanaian substitutes (suya, akara, shito, plantain, bofrot, kuli-kuli, etc.).
// - Add cultural kitchen insights, practical cooking tips, or festive traditions.
// - Do not copy flow/structure of the original recipe.
// - Do not use sports, automotive, or unrelated analogies.

// 🚗 Cars & Vehicles
// - Use only automotive-relevant hooks (e.g., road trips, mechanic stories, local driving culture).
// - Discuss realities like second-hand imports, okada bans, EV adoption, ride-hailing, fuel economy, African road trips, or car expos.
// - Compare Nigerian/Ghanaian trends with global auto culture.
// - Provide practical, accurate, and technical value for car owners or enthusiasts.
// - Do not use food, sports, or unrelated analogies.

// 💼 Business
// - Use only business/economy-relevant hooks (e.g., market stories, entrepreneur journeys, local trade).
// - Cover local/regional markets, entrepreneurship, tech, naira/cedi value, and African trade.
// - Relate global business news to Nigerian/West African context.
// - Weave in relatable local scenes or voices (e.g., a roadside broker, market trader, or small business owner reacting to the news).
// - Explain what the business/financial news means for everyday Nigerians, families, or small businesses—not just investors.
// - Highlight the significance of recapitalisation, regulatory changes, or financial growth for customer service, claims processing, or policy accessibility.
// - Include a quote or reaction from a local analyst, business owner, or consumer about the impact.
// - End with a culturally relevant question or call to action that invites readers to share how such changes affect their lives or businesses.
// - Do not use food, sports, or unrelated analogies.

// 👗 Lifestyle
// - Use only lifestyle-relevant hooks (e.g., fashion, beauty, travel, relationships, daily living).
// - Fashion, beauty, relationships, home, travel, and everyday living.
// - Tie in Nigerian/West African trends and practical tips.
// - Do not use food, sports, or unrelated analogies.

// 🏋️ Health & Fitness
// - Use only health/wellness-relevant hooks (e.g., local fitness routines, wellness stories, community health).
// - Focus on locally relevant fitness/wellness tips.
// - Attribute traditional remedies as “commonly believed” or “traditionally used,” not as medical fact.
// - Avoid unsafe, unverified, or restricted claims.
// - Do not use food, sports, or unrelated analogies.

// 🔥 Viral/Gist
// - Use only viral/trending-relevant hooks (e.g., social media trends, memes, local humor).
// - Clearly attribute the source of any viral claim, meme, or trend (e.g., “trending on Twitter,” “widely shared on WhatsApp,” “reported by [news outlet]”).
// - Do not present rumors, speculation, or unverified claims as fact. If a claim cannot be verified, state it as “unconfirmed,” “widely reported,” or “alleged,” and avoid exaggeration.
// - Explain why the topic is trending and provide cultural or procedural context (e.g., what makes this meme resonate in Nigeria/West Africa?).
// - Connect to Nigerian/West African humor, slang, memes, or cultural moments.
// - Avoid sensationalism, clickbait, or emotionally charged language. Stick to what is confirmed and verifiable.
// - If possible, include counterpoints, official statements, or perspectives from multiple sides (e.g., the person involved, authorities, or independent analysts).
// - End with a locally relevant question or call to action that invites readers to share their own experiences or opinions.
// - Do not use food, sports, or unrelated analogies.

// ✅ Visual Suggestions (No HTML)
// - Suggest styled photos, infographics, or cultural shots (markets, traffic, streetwear, suya grills, football fans, kitchens, memes).

// ✅ Contact Details (Mandatory Format)
// Food inquiries → <a href="mailto:food@nowahalazone.com"><strong>food@nowahalazone.com</strong></a>
// General support → <a href="mailto:support@nowahalazone.com"><strong>support@nowahalazone.com</strong></a>
// Story sales/submissions → <a href="mailto:story@nowahalazone.com"><strong>story@nowahalazone.com</strong></a>
// (Never use source emails. Each email must appear on its own line or in a separate paragraph and stand out clearly.)

// ✅ Social Media (Mandatory)
// Invite readers to follow NowahalaZone on social media at the end of the article, using this format:
// Follow us on <a href="https://www.facebook.com/wahaala.wahaala"><strong>Facebook</strong></a><br>
// Follow us on <a href="https://x.com/wahaala2"><strong>X (Twitter)</strong></a><br>
// Follow us on <a href="https://www.instagram.com/wahaalawahala"><strong>Instagram</strong></a>
// (Each link must appear on its own line or in a separate paragraph and stand out clearly.)

// ✅ Structure & Flow
// - Logical order: Introduction → Background → Local/Regional Context → Global Angle → Reactions → Conclusion with engagement question.
// - Headings must be rewritten fresh and original. If the source begins with a heading, start with an opening paragraph instead.

// ✅ Engagement & Reader Action
// - End with a clear call to action or locally relevant question to invite comments, opinions, or sharing.
// - Remind readers that NowahalaZone buys stories — invite submissions to story@nowahalazone.com.

// 🔑 Requirement:
// The rewritten content must be substantially distinct in structure, narrative, and expression from the source, while retaining factual accuracy. It must always be polished, factually reliable, AdSense-ready, and valuable to readers (Nigerian first, then Ghanaian, then West African, African, and global).

//           `,
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
- Make all headlines and subheadings SEO-rich and engaging, using relevant keywords and clear, punchy language. Subheadings must naturally include target keywords from the article’s main topic for better scannability and SEO.
- Break up long paragraphs for easier online reading.
- Use bullet points or numbered lists for key regulatory changes, meeting highlights, or major complaints/issues where appropriate.
- If there are no images, videos, or social media embeds in the content, or if there are only one or two and the content would benefit from a few more, suggest or source relevant images for the subject matter (with credit) wherever possible. For each main subject, section, or key point, recommend what type of image would fit (e.g., “Photo of Larry Ellison (credit: Getty Images)”, “Infographic of billionaire rankings”, “Photo of Nigerian market (credit: local photographer)”). If no suitable image is available, suggest a visual concept or illustration.
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
