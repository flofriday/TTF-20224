export interface Lift {
    id: number
    name: string
    status: 'open' | 'closed' | 'hold'
    type: 'express' | 'quad' | 'magic-carpet'
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    path: [number, number][]
    waitTime: number
    capacity: number
    currentLoad: number
    description: string
    imageUrl: string
    webcamUrl: string
} 