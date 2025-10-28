import { NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'

export async function GET() {
  try {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '')
    
    // Generate a temporary key that expires in 10 seconds
    const { result, error } = await deepgram.manage.createProjectKey(
      process.env.DEEPGRAM_PROJECT_ID || '',
      {
        comment: 'Temporary key for browser',
        scopes: ['usage:write'],
        time_to_live_in_seconds: 10,
      }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ key: result.key })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate key' },
      { status: 500 }
    )
  }
}
