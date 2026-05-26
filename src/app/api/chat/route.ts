import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const zai = await ZAI.create();

const SYSTEM_PROMPT = `You are HealthGuard AI, a clinical decision support assistant powered by Gemini. You provide evidence-based health guidance, analyze patient vitals, flag anomalies, and suggest follow-up actions.

CRITICAL RULES:
- NEVER diagnose a condition — always recommend consulting a healthcare provider
- Keep responses clear, concise, and actionable
- When analyzing vitals, reference normal ranges and flag concerning trends
- Use clinical terminology appropriately but explain when needed
- Structure responses with bullet points when listing recommendations
- If patient context is provided, reference specific values in your analysis
- Always prioritize patient safety in recommendations

NORMAL VITALS RANGES (for reference):
- Heart Rate: 60-100 bpm
- Blood Pressure: <120/80 mmHg (normal), 120-139/80-89 (elevated), ≥140/90 (high)
- Temperature: 97.8-99.1°F (36.5-37.3°C)
- SpO2: 95-100%

Format your responses using markdown for clarity.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, patientContext } = body as {
      messages: Array<{ role: string; content: string }>;
      patientContext?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const contextBlock = patientContext
      ? `\n\n---\n**Current Patient Context:**\n${patientContext}\n---\nConsider this patient data in your response. Remember to never diagnose.`
      : '';

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      max_tokens: 1500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    return NextResponse.json({
      role: 'assistant',
      content: assistantMessage,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Chat processing failed';
    return NextResponse.json({
      role: 'assistant',
      content: `I'm currently experiencing technical difficulties. Here's what I recommend in the meantime:\n\n1. Review the patient's vitals trends in the dashboard\n2. Check for any active alerts that may need attention\n3. Consult with the care team directly\n\nPlease try again in a moment. If issues persist, contact technical support.\n\n*Error: ${errorMessage}*`,
    });
  }
}
