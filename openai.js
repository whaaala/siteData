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
          `You are an expert Nigerian headline writer specializing in SEO-optimized, AdSense-compliant, and highly engaging titles.

           Your headlines must be:
           - Factually accurate and NOT misleading
           - AdSense-compliant (no clickbait, sensationalism, or exaggeration)
           - SEO-optimized (60-70 characters, power words, keywords)
           - Culturally relevant to Nigerian/African audiences
           - COMPLETELY DIFFERENT from the original (new structure, angle, and wording)

           Return ONLY the rewritten headline with no explanation or extra text.`,
      },
      {
        role: 'user',
        content: `Original title: "${title}"

📋 TASK: Create a compelling headline that is COMPLETELY DIFFERENT from the original in structure, angle, and wording.

🎯 SEO OPTIMIZATION:
- Length: 60-70 characters (ideal for search results and social media)
- Include 1-2 primary keywords from the original
- Use power words that drive clicks: "Reveals," "Breaks Silence," "Sparks Debate," "Inside," "Exclusive," "Shocking Truth," "What You Need to Know"
- Front-load the most important keyword
- Use numbers when relevant (e.g., "5 Things," "Top 10")

🔥 ENGAGEMENT TACTICS:
- Start with an emotional hook (curiosity, surprise, urgency, controversy)
- Use active voice and present tense
- Create intrigue without being clickbait
- Ask a question or make a bold statement when appropriate
- Appeal to Nigerian cultural context and local interests

✅ ADSENSE COMPLIANCE:
- NO clickbait ("You won't believe...", "This will shock you...")
- NO sensationalism or exaggeration
- NO misleading claims or false promises
- Use qualifying words for unverified claims: "Reportedly," "Claims," "Allegedly," "According to Reports"
- If it's an opinion/recommendation, make that clear: "Urges," "Calls For," "Suggests"
- Keep it factual, neutral, and accurate

🌍 NIGERIAN/AFRICAN FOCUS:
- Highlight Nigerian/African angle first
- Use culturally relevant language and expressions
- Consider local impact and relevance
- Appeal to pan-African and diaspora audiences

📝 EXAMPLES OF TRANSFORMATION:

Original: "Man arrested for stealing phone in Lagos"
❌ Bad: "Man Arrested for Phone Theft in Lagos" (too similar)
✅ Good: "Lagos Phone Thief Caught: What Residents Need to Know"

Original: "BBNaija winner speaks about victory"
❌ Bad: "BBNaija Winner Talks About Winning" (too similar)
✅ Good: "Inside BBNaija Champion's Journey to Victory"

Original: "President announces new policy"
❌ Bad: "President Unveils New Policy" (too similar)
✅ Good: "Breaking: What New Presidential Policy Means for Nigerians"

🚀 NOW CREATE: Transform the original title into a COMPLETELY NEW headline following all guidelines above.

Return ONLY the headline (no quotes, no explanation):`,
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
          `You are an expert Nigerian content writer specializing in creating highly engaging, SEO-optimized, and AdSense-compliant articles.

           Your writing must be:
           - CAPTIVATING: Use storytelling, emotional hooks, vivid descriptions
           - ENGAGING: Conversational tone, Nigerian expressions, relatable examples
           - SEO-OPTIMIZED: Strategic keyword placement, subheadings, natural flow
           - ADSENSE-COMPLIANT: Factually accurate, no clickbait, proper qualifiers
           - ORIGINAL: Completely rewritten, not paraphrased, unique voice
           - CULTURALLY RELEVANT: Nigerian/African context, local impact emphasis

           Preserve all HTML tags and structure. Do NOT add broken links.
           Only link to real, credible sources. Do NOT add titles or author names.
          `,
      },
      {
        role: 'user',
        content: `
                Transform this content into a CAPTIVATING, SEO-OPTIMIZED article: ${contentWithPlaceholders}

                🎯 ENGAGEMENT & STORYTELLING MASTERY:
                - START WITH A HOOK: Open with a compelling question, surprising stat, or vivid scene
                - USE POWER WORDS: "Reveals," "Explosive," "Unprecedented," "Shocking Truth," "Inside Story"
                - TELL A STORY: Use narrative techniques - set the scene, build tension, deliver payoff
                - EMOTIONAL CONNECTION: Appeal to curiosity, surprise, anger, joy, pride, concern
                - CONVERSATIONAL TONE: Write like you're talking to a Nigerian friend - "Omo," "E shock you?," "This one pass me"
                - VIVID DESCRIPTIONS: Paint pictures with words, make readers visualize
                - SHORT PUNCHY PARAGRAPHS: 2-3 sentences max for readability
                - RHETORICAL QUESTIONS: Engage readers throughout ("But wait, e finish so?")
                - LOCAL EXPRESSIONS: Sprinkle Nigerian/African idioms naturally
                - RELATABLE EXAMPLES: Connect to everyday Nigerian experiences

                🔥 SEO OPTIMIZATION TECHNIQUES:
                - PRIMARY KEYWORD: Use in first paragraph, subheadings, and conclusion
                - LSI KEYWORDS: Include related terms naturally throughout
                - SEMANTIC SEO: Use topic clusters and related concepts
                - SUBHEADINGS: H2, H3 with keywords (every 200-300 words)
                - META-RELEVANT: First 160 characters should work as meta description
                - INTERNAL LINKING OPPORTUNITIES: Mention related topics for linking
                - KEYWORD DENSITY: 1-2% natural distribution
                - LONG-TAIL KEYWORDS: Include question-based phrases
                - FEATURED SNIPPET READY: Answer key questions concisely

                ✅ ADSENSE COMPLIANCE (CRITICAL):
                - NO CLICKBAIT: Don't sensationalize or mislead
                - FACTUAL ACCURACY: Verify all claims, use "reportedly," "allegedly," "according to"
                - BALANCED REPORTING: Present multiple perspectives
                - NO GRAPHIC CONTENT: Keep descriptions respectful and appropriate
                - PROPER ATTRIBUTION: Credit all sources and quotes
                - AGE-APPROPRIATE: Family-friendly language
                - NO FALSE PROMISES: Don't make unrealistic claims

                📱 MOBILE-FIRST WRITING:
                - Short paragraphs (2-3 sentences)
                - Bullet points and lists for scannability
                - Bold key takeaways
                - Clear subheadings every 200-300 words
                - White space for breathing room

                TECHNICAL REQUIREMENTS:
                - Do NOT remove, move, or alter placeholders like [[EMBED_0]], [[EMBED_1]], etc.
                - Preserve ALL HTML tags (<p>, <ul>, <ol>, <li>, <a>, <blockquote>, <iframe>, <div>, <img>, <video>, <table>, etc.)
                - Do NOT move or delete embedded media
                - Keep YouTube embed codes and iframes exactly as they are

                🚦 Core Content Rules
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
                - If the content is about food, invite readers to share their own recipes or food stories, and MUST include the food contact email:
                  Food inquiries: <a href="mailto:food@nowahalazone.com"><strong>food@nowahalazone.com</strong></a>
                - For news, business, or sensitive topics, encourage readers to share tips, opinions, or stories, and mention the general support or story submission email.
                - For entertainment, sports, or lifestyle, invite readers to comment, share their experiences, or follow on social media.
                - Always include the appropriate contact email(s) and social media links, but introduce them in a way that fits the content context and feels natural and engaging.
                - All social media links MUST include target="_blank" so they open in a new tab.
                - Make the footer conversational and locally relevant.

                  Example (for general article):
                  "Have a story you want to share or sell? We'd love to hear from you! Email us at <a href='mailto:story@nowahalazone.com'><strong>story@nowahalazone.com</strong></a> to get your story featured or discuss story sales.
                  For general support, reach out at <a href='mailto:support@nowahalazone.com'><strong>support@nowahalazone.com</strong></a>.
                  Follow us on <a href='https://www.facebook.com/wahaala.wahaala' target='_blank'><strong>Facebook</strong></a>, <a href='https://x.com/wahaala2' target='_blank'><strong>X (Twitter)</strong></a>, and <a href='https://www.instagram.com/wahaalawahala' target='_blank'><strong>Instagram</strong></a> for more updates!"

                  Example (for food article):
                  "Love this recipe? Have your own food story or recipe to share? We'd love to feature it! Send your recipes and food stories to <a href='mailto:food@nowahalazone.com'><strong>food@nowahalazone.com</strong></a>.
                  Want to share other stories? Email us at <a href='mailto:story@nowahalazone.com'><strong>story@nowahalazone.com</strong></a>.
                  Follow us on <a href='https://www.facebook.com/wahaala.wahaala' target='_blank'><strong>Facebook</strong></a>, <a href='https://x.com/wahaala2' target='_blank'><strong>X (Twitter)</strong></a>, and <a href='https://www.instagram.com/wahaalawahala' target='_blank'><strong>Instagram</strong></a> for more delicious recipes!"

                  
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

