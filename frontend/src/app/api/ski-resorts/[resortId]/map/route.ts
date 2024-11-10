import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { resortId: string } }
) {
    try {
        const resortId = params.resortId
        const response = await fetch(`${API_URL}/ski-resorts/${resortId}/map`, {
            method: 'GET',
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`)
        }

        // Get the image
        const imageData = await response.arrayBuffer()

        // Return the image with the correct content type
        return new NextResponse(imageData, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000',
            },
        })
    } catch (error) {
        console.error('Error fetching ski resort map:', error)
        return new NextResponse(JSON.stringify({ error: 'Failed to fetch ski resort map' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }
} 