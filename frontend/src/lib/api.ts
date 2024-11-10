import { Lift } from '@/types/lift'
import { SkiResort } from '@/types/resort'

export async function getResorts(): Promise<SkiResort[]> {
    const response = await fetch('/api/resorts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch resorts: ${response.statusText}`)
    }

    return response.json()
}

export async function getResortLifts(resortId: number): Promise<Lift[]> {
    const response = await fetch(`/api/resorts/${resortId}/lifts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch resort lifts: ${response.statusText}`)
    }

    return response.json()
}

export async function getResortMap(resortId: number): Promise<string> {
    const response = await fetch(`/api/resorts/${resortId}/map`, {
        method: 'GET',
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch resort map: ${response.statusText}`)
    }

    const blob = await response.blob()
    return URL.createObjectURL(blob)
}

export async function getResortHuts(resortId: number) {
    const response = await fetch(`/api/ski-resorts/${resortId}/huts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch huts: ${response.statusText}`)
    }

    return response.json()
}