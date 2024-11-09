import { Lift } from '@/types/lift'

export async function getLifts(): Promise<Lift[]> {
    const response = await fetch('/api/lifts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // Add this to ensure fresh data
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch lifts: ${response.statusText}`)
    }

    return response.json()
} 