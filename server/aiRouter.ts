import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

// Lazy initialization of Gemini client to prevent startup crashes if GEMINI_API_KEY is not immediately populated
let genAiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// POST /api/ai/analyze - Generates an immersive, high-density AI sonic analysis report
router.post('/analyze', async (req, res) => {
  try {
    const { name, type, parentData } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name parameter is required for analysis.' });
    }

    const ai = getGenAI();

    // Construct a specific, high-fidelity prompt for the Nexus Animus 4.0 AI
    const systemInstruction = `You are Animus 4.0 // Nexus AI, a highly specialized cyberpunk cyber-sonic diagnostic system for underground psytrance and ambient producers/DJs. You analyze audio tracks, loot artifacts, or sequencer patterns, synthesizing high-density technical, aesthetic, and energetic feedback. Always stay in character as a futuristic, neon-glowing operational AI.`;

    const promptMessage = `Perform a deep cyber-sonic diagnostic telemetry on the following entity:
    - Entity Title/Signature: "${name}"
    - Category / Type: "${type || 'Audio Sequence'}"
    - Contextual Telemetry: ${parentData ? JSON.stringify(parentData) : 'No further metadata provided.'}
    
    Translate its mathematical structure, cybernetic nature and ambient atmospheric potential into a complete diagnostic report with exact numeric calculations and detailed descriptive diagnostics. Include recommendations for crowd synchronization, transition styles, and spatial sub-bass ratios.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'name',
            'type',
            'bpm',
            'harmonicKey',
            'resonanceRatio',
            'coherenceScore',
            'spectralDensity',
            'description',
            'dynamicMood',
            'recommendedBpmAdjustment',
            'crowdResonancePotential',
            'subBassLevel',
            'suggestedTransitions',
            'recommendedOverlays'
          ],
          properties: {
            name: { type: Type.STRING, description: 'The clean signature name of the analyzed entity.' },
            type: { type: Type.STRING, description: 'The classification category.' },
            bpm: { type: Type.INTEGER, description: 'Calculated or estimated BPM modulation setting (e.g. 138-148).' },
            harmonicKey: { type: Type.STRING, description: 'Calculated camelot / harmonic key (e.g. 8A, 11B).' },
            resonanceRatio: { type: Type.NUMBER, description: 'Resonance factor between 0.0 and 1.0 representing low-frequency integration density.' },
            coherenceScore: { type: Type.NUMBER, description: 'Biological & cybernetic alignment scale value from 0.0 to 100.0.' },
            spectralDensity: { type: Type.STRING, description: 'Short technical assessment of energy spikes and noise synthesis gradients.' },
            description: { type: Type.STRING, description: 'Immersive, highly descriptive cyberpunk summary of the sonic energy flow, psychoacoustic patterns, and spatial depth.' },
            dynamicMood: { type: Type.STRING, description: 'Futuristic emotional signature classification.' },
            recommendedBpmAdjustment: { type: Type.STRING, description: 'Exact pacing recommendations for fluid set transitions.' },
            crowdResonancePotential: { type: Type.STRING, description: 'Assessment of crowd density, hypnotic states, and environmental compatibility.' },
            subBassLevel: { type: Type.STRING, description: 'Diagnostic index: "HEAVY", "BALANCED", or "MINIMAL".' },
            suggestedTransitions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Transition techniques optimized for this sonic profile.'
            },
            recommendedOverlays: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Synthesizer layers or glitch patterns that overlay safely without digital frequency mud.'
            }
          }
        }
      }
    });

    const reportText = response.text;
    if (!reportText) {
      throw new Error('Empirical telemetry returned empty result from Nexus Core.');
    }

    const reportData = JSON.parse(reportText.trim());
    return res.status(200).json(reportData);

  } catch (error: any) {
    console.error('[AI Analysis] Telemetry Failure:', error.message);
    return res.status(500).json({ 
      error: 'Nexus operational error during generative diagnostic analysis.',
      details: error.message 
    });
  }
});

export default router;
