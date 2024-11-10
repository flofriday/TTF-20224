import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
    request: NextRequest,
    { params }: { params: { resortId: string } }
) {
    try {
        const response = await fetch(`${API_URL}/ski-resorts/${params.resortId}/lifts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching resort lifts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch resort lifts' },
            { status: 500 }
        )
    }
} 