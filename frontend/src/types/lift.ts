export interface Lift {
    id: string
    name: string
    status: 'open' | 'closed' | 'hold'
    type: 'express' | 'quad' | 'magic-carpet'
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    wait_time: number
    path: number[][] | string
    capacity: number
    currentLoad: number
    description: string
    imageUrl: string
    webcamUrl: string
}

export const getQueueStatus = (waitTime: number): 'none' | 'light' | 'medium' | 'heavy' => {
    if (waitTime <= 2) return 'none'        // 0-2 minutes: no queue
    if (waitTime <= 5) return 'light'       // 2-5 minutes: light queue
    if (waitTime <= 10) return 'medium'     // 5-10 minutes: medium queue
    return 'heavy'                          // >10 minutes: heavy queue
} 