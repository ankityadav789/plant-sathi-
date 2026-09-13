const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing. Please configure your environment variables.');
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function enforceDiseaseSafety(report, disease) {
  if (!report || !disease) return report;

  const confidence = Number(disease.confidence || 0);
  const status = String(disease.status || '').toLowerCase();

  const uncertain =
    status === 'uncertain' ||
    status === 'not available' ||
    confidence < 70;

  if (!uncertain) {
    return report;
  }

  const blockedTreatmentTypes = new Set([
    'treatment',
    'fertilizer',
  ]);

  const safeRecommendations = Array.isArray(report.recommendations)
    ? report.recommendations.filter((rec) => {
        const type = String(rec?.type || '').toLowerCase();

        return !blockedTreatmentTypes.has(type);
      })
    : [];

  report.recommendations = safeRecommendations.map((rec) => {
    const type = String(rec?.type || '').toLowerCase();

    if (type === 'fertilizer') {
      return {
        ...rec,
        quantity: null,
        frequency: null,
        warnings: [
          ...(Array.isArray(rec.warnings) ? rec.warnings : []),
          'Avoid specific fertilizer dosing while the plant health assessment is uncertain.'
        ]
      };
    }

    return rec;
  });

  const uncertaintyNote =
    'The disease assessment is uncertain, so recommendations focus on observation and general plant care rather than disease-specific treatment.';

  report.diseaseExplanation = `${report.diseaseExplanation || ''} ${uncertaintyNote}`.trim();

  return report;
}

/**
 * Real Groq-powered plant doctor that generates unified advice.
 * Returns a structured JSON object.
 */
async function generatePlantReport(plantData) {
  const client = getGroqClient();

  const { nameEn, scientificName, healthScore, disease, weather } = plantData;

  const diseaseLabel = String(disease?.name || '').toLowerCase();

  const isHealthyPrediction =
    diseaseLabel.includes('healthy');

  const diseaseContext = isHealthyPrediction
    ? `Disease prediction: Healthy.
Confidence: ${disease.confidence}%.
Status: ${disease.status}.
Explanation: ${disease.cause}.`
    : `Disease prediction: ${disease.name}.
Severity: ${disease.severity}.
Confidence: ${disease.confidence}%.
Affected Area: ${disease.affectedArea}.
Status: ${disease.status}.
Cause: ${disease.cause}.`;

  const weatherContext = weather
    ? `Current weather: ${weather.condition}, ${weather.temperature}°C, Humidity ${weather.humidity}%, Wind: ${weather.windSpeed} km/h, UV Index: ${weather.uvIndex || 'Unknown'}.`
    : '';

  const prompt = `You are PlantSathi AI, an expert botanist and plant doctor.

Analyze the plant using ONLY the information provided below.

IMPORTANT SAFETY RULES:
1. Never claim that a disease is confirmed when disease.status is "Uncertain" or "Not Available".
2. When disease confidence is below 70%:
   - Treat the disease result as uncertain.
   - Do NOT recommend disease-specific treatment.
   - Do NOT recommend fungicides, pesticides, insecticides, antibiotics, or chemical treatments.
   - Do NOT prescribe fertilizer dosage or concentration unless the diagnosis and plant condition clearly justify it.
   - Focus recommendations on safe observation, watering based on soil moisture, airflow, sunlight, sanitation, and monitoring.
3. When disease.status is "Not Available":
   - Do not speculate about diseases.
   - Explain that disease identification is unavailable for this species.
   - Give only general plant-care recommendations.
4. When disease.status is "Healthy" with confidence >= 70%, you may provide normal preventive care recommendations.
5. Never invent a disease, symptom, treatment, dosage, or measurement that is not supported by the provided data.
6. Recommendations must be practical and conservative.
7. Weather information should influence advice, especially watering, humidity, rainfall, heat, and airflow.
8. When disease.status is "Uncertain" or disease confidence is below 70%, do not provide numeric fertilizer doses, pesticide/fungicide concentrations, or other chemical treatment quantities.
9. For watering, avoid inventing a fixed volume when actual soil moisture, pot size, or plant size is unknown. Prefer conditional guidance such as checking soil moisture before watering.
Plant information:
Plant: ${nameEn} (${scientificName})
Health Score: ${healthScore}/100

Disease information:
${diseaseContext}

${weatherContext}

Return the requested structured report.`;

  try {
const completion = await client.chat.completions.create({
  model: 'openai/gpt-oss-120b',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.3,
  max_completion_tokens: 1500,
  reasoning_effort: 'low',
  reasoning_format: 'hidden',
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'plant_doctor_report',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          plantFamily: {
            type: 'string'
          },
          plantCategory: {
            type: 'string',
            enum: ['Crop', 'Tree', 'Flower', 'Indoor Plant', 'Herb']
          },
          nativeRegion: {
            type: 'string'
          },
          summary: {
            type: 'string'
          },
          healthExplanation: {
            type: 'string'
          },
          diseaseExplanation: {
            type: 'string'
          },
          overallGrade: {
            type: 'string',
            enum: ['A', 'B', 'C', 'D', 'E', 'F']
          },
          smartInsights: {
            type: 'object',
            properties: {
              todaysChecklist: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              tomorrowsAdvice: {
                type: 'string'
              },
              weeklyCarePlan: {
                type: 'string'
              }
            },
            required: [
              'todaysChecklist',
              'tomorrowsAdvice',
              'weeklyCarePlan'
            ],
            additionalProperties: false
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'Treatment',
                    'Prevention',
                    'Watering',
                    'Fertilizer',
                    'Sunlight',
                    'Airflow'
                  ]
                },
                title: {
                  type: 'string'
                },
                summary: {
                  type: 'string'
                },
                reason: {
                  type: 'string'
                },
                actionSteps: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                quantity: {
                  type: ['string', 'null']
                },
                frequency: {
                  type: ['string', 'null']
                },
                warnings: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                confidence: {
                  type: 'number'
                }
              },
              required: [
                'type',
                'title',
                'summary',
                'reason',
                'actionSteps',
                'quantity',
                'frequency',
                'warnings',
                'confidence'
              ],
              additionalProperties: false
            }
          }
        },
        required: [
          'plantFamily',
          'plantCategory',
          'nativeRegion',
          'summary',
          'healthExplanation',
          'diseaseExplanation',
          'overallGrade',
          'smartInsights',
          'recommendations'
        ],
        additionalProperties: false
      }
    }
  }
});

    const raw = completion.choices[0]?.message?.content || '{}';

    const parsed = JSON.parse(raw);

    const safeReport = enforceDiseaseSafety(parsed, disease);

    return {
      success: true,
      report: safeReport
    };
  } catch (err) {
    console.error('[Groq Error]', err.message);
    // Graceful fallback
    return {
      success: false,
      report: {
        plantFamily: 'Unknown Family',
        plantCategory: 'Unknown Category',
        nativeRegion: 'Unknown Region',
        summary: `${nameEn} analysis complete. Please ensure consistent watering and adequate light.`,
        healthExplanation: 'The health score is derived from visual disease symptoms and optimal weather conditions.',
        diseaseExplanation: diseaseContext,
        overallGrade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : 'C',
        smartInsights: {
          todaysChecklist: ['Monitor soil moisture', 'Ensure adequate indirect sunlight', 'Wipe leaves'],
          tomorrowsAdvice: 'Maintain consistent environment.',
          weeklyCarePlan: 'Check moisture levels every few days and adjust watering as needed.'
        },
        recommendations: [
          {
            type: 'Watering',
            title: 'Regular Watering',
            summary: 'Water every 5–7 days or when the top inch of soil feels dry.',
            reason: 'Consistent moisture is critical for plant health.',
            actionSteps: ['Check top soil dryness', 'Water until it drains from the bottom'],
            quantity: 'Moderate amount',
            frequency: 'Every 5–7 days',
            warnings: ['Avoid overwatering — root rot risk'],
            confidence: 70,
          },
          {
            type: 'Prevention',
            title: 'General Care',
            summary: 'Ensure good air circulation and avoid overwatering.',
            reason: 'Preventive measures reduce disease risk.',
            actionSteps: ['Ensure good air circulation', 'Do not overwater', 'Wipe leaves weekly'],
            quantity: null,
            frequency: 'Ongoing',
            warnings: [],
            confidence: 80,
          }
        ],
      },
    };
  }
}

module.exports = { generatePlantReport };
