import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const MAX_CHARS = 900;
    const maxTokens = 300;
    const baseSystemPrompt = {
      role: "system",
      content: `Never reply with more than ${MAX_CHARS} characters. If you reach that, stop your answer immediately.`
    };

    const { messages } = await req.json()
    const modMessages = [baseSystemPrompt, ...messages];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: modMessages,
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('groq api error:', error)
      return new NextResponse('failed to get response from groq', { status: response.status })
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('error in chat route:', error)
    return new NextResponse('internal server error', { status: 500 })
  }
}