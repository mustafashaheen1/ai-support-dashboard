// app/api/analyze-ticket/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  // Add this debug line
  console.log('API received:', body)
  
  try {
    // Call your n8n webhook - make sure to pass ALL the data
    const response = await fetch('https://mustafashaheen.app.n8n.cloud/webhook-test/6f1d6496-0056-428a-ac6b-0f073409cc5f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket: body.ticket,
        customerId: body.customerId,
        subject: body.subject  // Add this line!
      })
    })
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze ticket' },
      { status: 500 }
    )
  }
}