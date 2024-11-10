import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { resortId: string } }
) {
    try {
        const resortId = params.resortId
        const response = await fetch(`${API_URL}/ski-resorts/${resortId}/huts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`)
        }

        const huts = await response.json()
        return NextResponse.json(huts)
    } catch (error) {
        console.error('Error fetching huts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch huts' },
            { status: 500 }
        )
    }
} 