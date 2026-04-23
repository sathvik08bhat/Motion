import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const keys = [
    process.env.AI_API_KEY,
    process.env.AI_API_KEY_2,
    process.env.AI_API_KEY_3
  ].filter(Boolean);

  if (keys.length === 0) {
    return NextResponse.json({ error: 'No AI API keys are configured on the server.' }, { status: 500 });
  }

  try {
    const { messages, config } = await req.json();
    let lastError = null;

    // Failover Logic: Try all available keys
    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config?.model || 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: config?.temperature || 0.7,
            max_tokens: config?.max_tokens || 1024
          })
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }

        const errorData = await response.json();
        console.warn(`AI Key ${i + 1} failed:`, errorData.error?.message || 'Unknown error');
        lastError = errorData.error?.message || 'AI request failed';
      } catch (err: any) {
        console.error(`AI Key ${i + 1} transport error:`, err);
        lastError = err.message;
      }
    }

    return NextResponse.json({ error: lastError || 'All AI keys failed.' }, { status: 500 });
  } catch (error) {
    console.error('API Route AI Internal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
