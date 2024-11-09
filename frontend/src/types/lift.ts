export interface Lift {
    id: string
    name: string
    status: 'open' | 'closed' | 'hold'
    type: 'express' | 'quad' | 'magic-carpet'
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    waitTime: number
    path: number[][] | string
    capacity: number
    currentLoad: number
    description: string
    imageUrl: string
    webcamUrl: string
} 