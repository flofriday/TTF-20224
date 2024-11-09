import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/ski-map`, {
            method: 'GET',
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`)
        }

        const imageBlob = await response.blob()
        return new NextResponse(imageBlob, {
            headers: {
                'Content-Type': 'image/png'
            }
        })
    } catch (error) {
        console.error('Error fetching ski map:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ski map' },
            { status: 500 }
        )
    }
} 