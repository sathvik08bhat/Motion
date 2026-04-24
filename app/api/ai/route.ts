import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log("[AI API] Received request on /api/ai");
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    console.error("[AI API] AI_API_KEY not found!");
    return NextResponse.json({ error: 'AI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const { messages, config } = await req.json();

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config?.model || 'gemini-1.5-flash',
        messages: messages,
        temperature: config?.temperature || 0.7,
        max_tokens: config?.max_tokens || 2048
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorText;
    } catch {}
    
    console.error(`[AI API] Gemini Request Failed: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: response.status });

  } catch (error) {
    console.error('API Route AI Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
