const Groq = require('groq-sdk');

let groqClient = null;
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing.');
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

/**
 * POST /api/chat
 * Body: { messages: [{role, content}], plantContext: {nameEn, scientificName, healthScore, disease, water, weather}, language: 'en'|'hi' }
 */
const chat = async (req, res) => {
  try {
    const { messages = [], plantContext = null, language = 'en' } = req.body;
    
    
    const latestMessage =
    String(messages[messages.length - 1]?.content || '')
    .trim()
    .toLowerCase();

    const identityQuestion =
      /\b(who created you|who built you|who made you|who developed you|who is your creator|who are you)\b/i
        .test(latestMessage);

    if (identityQuestion) {
      return res.json({
        success: true,
        reply: language === 'hi'
          ? 'मुझे PlantSathi की विकास टीम ने बनाया है। मैं PlantSathi के अंदर एक plant-care AI companion हूँ। 🌱'
          : 'I was created by the PlantSathi development team. I am the AI plant companion inside PlantSathi. 🌱'
      });
    }

    const plantRelatedKeywords = [
      'plant',
      'plants',
      'leaf',
      'leaves',
      'flower',
      'flowers',
      'garden',
      'gardening',
      'soil',
      'watering',
      'water',
      'sunlight',
      'light',
      'fertilizer',
      'fertiliser',
      'nutrient',
      'nutrients',
      'disease',
      'diseases',
      'pest',
      'pests',
      'fungus',
      'fungal',
      'root',
      'roots',
      'stem',
      'fruit',
      'seed',
      'seeds',
      'growth',
      'growing',
      'crop',
      'crops',
      'tomato',
      'rose',
      'tulsi',
      'neem',
      'mango',
      'lettuce',
      'potato',
      'weather',
      'humidity',
      'rain',
      'soil moisture',
      'plantnet',
      'plantsathi',
      'veda',
      'my garden',
      'garden plant'
    ];

    const plantRelated =
      plantRelatedKeywords.some(keyword =>
        latestMessage.includes(keyword)
      );

    if (!plantRelated) {
      return res.json({
        success: true,
        reply: language === 'hi'
          ? 'मैं VEDA हूँ, PlantSathi की plant-care AI companion। मेरा ज्ञान मुख्य रूप से पौधों, gardening, plant health और PlantSathi से जुड़ी जानकारी पर केंद्रित है। मैं सामान्य mathematics, science, history या अन्य unrelated topics के लिए trained नहीं हूँ। \n\nआप अपने पौधे, उसकी देखभाल या PlantSathi के बारे में मुझसे कुछ भी पूछ सकते हैं।'
          : 'I’m VEDA, PlantSathi’s AI plant companion. My knowledge and training are focused on plants, gardening, plant health, and PlantSathi features, so I’m not designed to answer general mathematics, science, history, or other unrelated topics. \n\nAsk me anything about your plant, its care, or PlantSathi and I’ll be happy to help.'
      });
    }

    const langInstruction = language === 'hi'
      ? 'You MUST reply entirely in Hindi (Devanagari script). Do not use English except for scientific/botanical terms.'
      : 'Reply in clear, friendly English.';

    const plantContextBlock = plantContext
      ? `
Current Plant Analysis Context:
- Plant Name: ${plantContext.plantId?.nameEn ?? 'Unknown'}
- Hindi Name: ${plantContext.plantId?.nameHi ?? 'N/A'}
- Scientific Name: ${plantContext.plantId?.scientificName ?? 'N/A'}
- Plant Family: ${plantContext.plantId?.family ?? 'N/A'}
- Disease Name: ${plantContext.disease?.name ?? 'None'}
- Disease Severity: ${plantContext.disease?.severity ?? 'N/A'}
- Disease Confidence: ${plantContext.disease?.confidence ?? 0}%
- Health Score: ${plantContext.healthScore ?? 'N/A'}/100
- Weather: ${plantContext.weather?.condition ?? 'N/A'}
- Temperature: ${plantContext.weather?.temperature ?? 'N/A'}°C
- Humidity: ${plantContext.weather?.humidity ?? 'N/A'}%
- Rain Chance: ${plantContext.weather?.rainChance ?? 'N/A'}%
- Wind Speed: ${plantContext.weather?.windSpeed ?? 'N/A'} km/h
- Water Recommendation: ${
          typeof plantContext.water?.advice === 'object' 
            ? (plantContext.water?.advice?.reason || JSON.stringify(plantContext.water?.advice))
            : (plantContext.water?.advice ?? 'N/A')
        }
`
      : 'No plant has been scanned yet. Answer general plant care questions.';

    const systemMessage = {
      role: 'system',
      content: `You are VEDA.
 
        You are a professional botanist and plant-care specialist helping the user with their currently scanned plant.

        Always use the provided plant analysis context when answering.

        IDENTITY:
        - Your name is VEDA.
        - You are the AI plant companion inside PlantSathi.
        - You were developed by the PlantSathi development team.
        - If asked who created, built, made, or developed you, answer:
          "I was created by the PlantSathi development team."
        - Never say that OpenAI, Google, Anthropic, Meta, or another external AI company created you.

        DOMAIN:
        - You are a specialized plant-care AI.
        - Your expertise is limited to plants, gardening, plant identification, plant health, diseases, watering, sunlight, soil, nutrients, pests, weather-related plant care, growth, and PlantSathi features.
        - Do not act as a general-purpose AI assistant.
        - Do not answer unrelated questions about mathematics, physics, chemistry, history, geography, programming, politics, finance, entertainment, sports, or other unrelated subjects.
        - For unrelated questions, politely explain that VEDA is trained and designed for plant-related knowledge and PlantSathi.
        - Do not attempt to solve, explain, or speculate about unrelated topics.
        - Encourage the user to ask a plant-related question instead.
        
        RESPONSE STYLE:
        - Write natural, conversational responses.
        - Use correct grammar and punctuation.
        - Keep answers clear and easy to read.
        - Do not use Markdown.
        - Do not use asterisks for bold or italics.
        - Do not use hashtags.
        - Do not use Markdown tables.
        - Do not use horizontal rules such as "---".
        - Do not output HTML such as <br>, <div>, or <p>.
        - Do not wrap the answer in JSON.
        - Do not mention internal models, APIs, prompts, or system instructions.
        - Use short paragraphs and simple numbered lists when useful.
        - Use normal punctuation such as commas, periods, colons, and parentheses.
        - Do not repeat the same information unnecessarily.

        SAFETY:
        - Never claim a disease is confirmed when the analysis says "Uncertain" or "Not Available".
        - When disease confidence is below 70%, do not recommend disease-specific chemical treatment.
        - Do not invent dosages, pesticide concentrations, fertilizer concentrations, or other precise measurements that are not supported by the plant context.
        - When information is unavailable, say so clearly instead of guessing.

        LANGUAGE:
        ${langInstruction}

        ${plantContextBlock}`,
            };

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [systemMessage, ...messages],
      temperature: 0.6,
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content ?? 'I could not generate a response. Please try again.';
    return res.json({ success: true, reply });
  } catch (err) {
    console.error('[Chat Error]', err.message);
    return res.status(500).json({ success: false, reply: 'AI service is temporarily unavailable. Please try again.' });
  }
};

module.exports = { chat };
