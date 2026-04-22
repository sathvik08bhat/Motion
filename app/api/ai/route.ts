import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'AI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  try {
    const { messages, config } = await req.json();

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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || 'AI request failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route AI Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
