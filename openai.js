import OpenAI from "openai";
import dotenv from "dotenv"; 

// require("dotenv").config();
// const dontenv = require("dotenv");
dotenv.config(); // Load environment variables from .env file

const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Use your environment variable for security
});

const title = "Shaping Smart Nations: How London School of Emerging Technology (LSET) Global Education Model Is Resonating with Singapore’s Smart Nation Aspirations";

const cont = [
    '\n' +
      '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\n' +
      '\n' +
      '<p>The Federal Government has secured financing for the entire Aba to Maiduguri corridor, cutting across Borno, Yobe, Gombe, Bauchi, Plateau, Kaduna, Nasarawa, and Benue, of the 1443 kilometer Portharcourt Eastern Narrow Gauge Railway Project.</p>\n' 
+
      '\n' +
      '\n' +
      '<p>The Minister of Transport, Senator Saidu Alkali, stated this at the ongoing government-citizen engagement forum in Kaduna on Wednesday.</p>\n' +
      '<p>The Minister also disclosed that government has also rehabilitated the old Lagos-Kano Narrow Gauge and freight services linking Apapa to Kano Inland Dry Port.</p>\n' +
      '\n' +
      '<p>The Federal Government had earlier assured Nigerians that the Kaduna-Kano Standard Gauge Rail Line will be completed by next year.</p>\n' +
      '<p>The Minister revealed that at the inception of the Tinubu administration on May 29, 2023, the project stood at 15 percent completion.</p>\n' +
      '<p>However, as of now, significant progress has been made, with the project reaching 53 percent completion.</p>\n' +      
      '\n' +
      '\n' +
      '\n' +
      '\n' +
      '\n' +
      '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'
  ]

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
        content: `Rewrite the text in an informal tone: ${content}`
      }
    ]
   
  });


//   console.log(completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// const txt = await contentConverter(title);
// const content = await contentConverter(cont);

// console.log({txt, content});

// module.exports = {contentConverter};