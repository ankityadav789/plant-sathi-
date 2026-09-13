const Groq = require('groq-sdk');

const MODEL = 'qwen/qwen3.6-27b';

function parseFinalAnswer(content) {
  if (!content) return null;

  const text = String(content).trim();

  // 1. Preferred format: FINAL: YES / FINAL: NO
  const finalMatch = text.match(/FINAL\s*:\s*(YES|NO)\b/i);
  if (finalMatch) {
    return finalMatch[1].toUpperCase();
  }

  // 2. Check for a standalone YES/NO near the end of the response
  const endMatch = text.match(/\b(YES|NO)\b[\s\S]*$/i);
  if (endMatch) {
    return endMatch[1].toUpperCase();
  }

  // 3. Some reasoning models may put the answer after </think>
  const thinkEnd = text.match(/<\/think>\s*(YES|NO)\b/i);
  if (thinkEnd) {
    return thinkEnd[1].toUpperCase();
  }

  return null;
}

let groqClient = null;

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) groqClient = new Groq({ apiKey });
  return groqClient;
}

/**
 * Pre-analysis quality check using Groq Vision.
 * Validates if the image actually contains a plant and is clear enough.
 * 
 * @param {Buffer} imageBuffer 
 * @returns {Promise<{usable: boolean, reason: string, isValid: boolean, message: string}>}
 */
async function validateImageQuality(imageBuffer) {
  const client = getGroqClient();

  // If no client, we gracefully skip validation to avoid blocking the pipeline
  if (!client) {
    return { isValid: true, message: 'Valid' };
  }

  const base64Image = imageBuffer.toString('base64');
  const imageUrl = `data:image/jpeg;base64,${base64Image}`;

  const prompt = `You are the image-quality gate for PlantSathi AI.

Look at the image and decide whether it is suitable for plant identification.

Return exactly ONE word:
YES
or
NO

Return YES only when:
- a real plant is clearly visible
- the plant is the main subject
- the image is clear enough for species identification

Return NO when:
- the image is not a plant
- the image is too blurry
- the image is too dark or overexposed
- the plant is too small or too far away
- the plant is heavily obstructed
- the image is a screenshot, drawing, icon, or unrelated image

Do not explain your answer.
Do not use markdown.
Output only YES or NO.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 20,
      reasoning_effort: 'none',
      reasoning_format: 'hidden',
    });

    const content = completion.choices?.[0]?.message?.content || '';

    const finalAnswer = parseFinalAnswer(content);
    console.log('[Image Quality] Model decision:', finalAnswer || 'UNPARSED');

    if (finalAnswer === 'YES') {
      const result = {
        usable: true,
        reason: 'Image appears to be a clear, usable plant photo.'
      };
      return { ...result, isValid: result.usable, message: result.reason };
    }

    if (finalAnswer === 'NO') {
      const result = {
        usable: false,
        reason: 'The uploaded image does not contain a sufficiently clear plant subject for reliable identification.'
      };
      return { ...result, isValid: result.usable, message: result.reason };
    }

    const result = {
      usable: false,
      reason: 'The image quality could not be verified. Please upload a clearer photo of the plant.'
    };

    console.warn('[Image Quality] ⚠️ Could not parse model decision — rejecting image');

    return {
      ...result,
      isValid: result.usable,
      message: result.reason
    };
  } catch (err) {
    console.error('[Image Quality Check Error]', err.message);
    // If the vision model fails to respond, allow the image through to prevent blocking users
    return { isValid: true, message: 'Skipped due to API error' };
  }
}

module.exports = { validateImageQuality };
