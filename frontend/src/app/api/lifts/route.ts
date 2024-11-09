import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic' // Disable caching for this route

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/ski-lifts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Add this to ensure fresh data
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching lifts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch lifts' },
            { status: 500 }
        )
    }
} 