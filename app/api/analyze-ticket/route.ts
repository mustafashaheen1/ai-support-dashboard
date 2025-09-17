// app/api/analyze-ticket/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  console.log('1. API Route called with:', body)
  
  try {
    // Use environment variable or fallback
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'your-webhook-url-here'
    
    console.log('2. Calling webhook:', webhookUrl)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket: body.ticket,
        customerId: body.customerId,
        subject: body.subject
      })
    })
    
    console.log('3. Webhook response status:', response.status)
    
    const data = await response.json()
    console.log('4. Webhook response data:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('5. Error calling webhook:', error) // Now 'error' is used
    return NextResponse.json(
      { error: 'Failed to analyze ticket' },
      { status: 500 }
    )
  }
}