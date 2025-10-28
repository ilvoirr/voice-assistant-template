// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  
  // This is the SAME key you use for the microphone
  const key = process.env.DEEPGRAM_API_KEY; 

  if (!key || !text) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_DEEPGRAM_API_KEY or text" },
      { status: 400 }
    );
  }

  try {
    // Deepgram's Aura TTS API
    // Model: "aura-asteria-en" (female) or "aura-luna-en" (male)
    const resp = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": `Token ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error("Deepgram TTS Error:", detail);
      return NextResponse.json({ error: "TTS API failed", detail }, { status: resp.status });
    }

    // Deepgram returns the audio data directly
    const arrayBuffer = await resp.arrayBuffer();
    
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" }
    });

  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}