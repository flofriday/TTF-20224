'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { getLifts } from '@/lib/api'
import { Lift } from '@/types/lift'
import { drawLiftLine } from '@/lib/utils'

const statusColors = {
    open: 'bg-emerald-500 text-white',
    closed: 'bg-red-500 text-white',
    hold: 'bg-amber-500 text-white'
}

const typeIcons = {
    'express': '⚡',  // Express lift
    'quad': '4️⃣',    // Quad lift
    'magic-carpet': '🔮', // Magic carpet
}

const difficultyColors = {
    'beginner': 'bg-green-500 text-white',
    'intermediate': 'bg-blue-500 text-white',
    'advanced': 'bg-black text-white'
}

export default function Home() {
    const [selectedLift, setSelectedLift] = useState<string | null>(null)
    const [lifts, setLifts] = useState<Lift[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Function to draw all lift lines
    const drawLifts = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw each lift line
        lifts.forEach((lift) => {
            drawLiftLine(
                ctx,
                lift.path,
                selectedLift === lift.id ? '#0f172a' : '#64748b',
                selectedLift === lift.id ? 4 : 2
            )
        })
    }

    // Effect to redraw canvas when selected lift or lifts change
    useEffect(() => {
        drawLifts()
    }, [selectedLift, lifts])

    useEffect(() => {
        const fetchLifts = async () => {
            try {
                setIsLoading(true)
                const data = await getLifts()
                setLifts(data)
                setError(null)
            } catch (err) {
                console.error('Failed to fetch lifts:', err)
                setError('Failed to load lift data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchLifts()
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
                <main className="container mx-auto p-6 space-y-8 max-w-5xl">
                    <Card className="p-8">
                        <p className="text-center text-slate-600">Loading lift data...</p>
                    </Card>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
                <main className="container mx-auto p-6 space-y-8 max-w-5xl">
                    <Card className="p-8">
                        <p className="text-center text-red-600">{error}</p>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            <main className="container mx-auto p-6 space-y-8 max-w-5xl">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900">Mountain Resort Map</h1>
                    <p className="text-slate-600">Select a lift to see its route and details</p>
                </div>

                {/* Status Legend */}
                <div className="flex gap-4 flex-wrap">
                    {Object.entries(statusColors).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.split(' ')[0]}`} />
                            <span className="capitalize text-sm text-slate-600">{status}</span>
                        </div>
                    ))}
                </div>

                {/* Map Container */}
                <Card className="relative w-full h-[600px] overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-slate-200/50" />
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        width={600}
                        height={600}
                    />

                    {/* Lift Markers */}
                    {lifts.map((lift) => (
                        <HoverCard key={lift.id}>
                            <HoverCardTrigger>
                                <div
                                    className={`absolute cursor-pointer transition-all duration-300
                                    ${selectedLift === lift.id ? 'scale-150 z-20' : 'scale-100 z-10'}`}
                                    style={{
                                        left: lift.path[0][0],
                                        top: lift.path[0][1],
                                    }}
                                >
                                    <div className={`w-6 h-6 rounded-full ${statusColors[lift.status]} 
                                        shadow-lg flex items-center justify-center
                                        border-2 border-white transform -translate-x-1/2 -translate-y-1/2`}>
                                        <span className="text-xs">{typeIcons[lift.type]}</span>
                                    </div>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">{lift.name}</h4>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className={statusColors[lift.status]}>
                                            {lift.status.toUpperCase()}
                                        </Badge>
                                        <Badge variant="secondary" className={difficultyColors[lift.difficulty]}>
                                            {lift.difficulty.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Wait time: {lift.waitTime} minutes
                                    </p>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    ))}
                </Card>

                {/* Lift List */}
                <div className="grid gap-4">
                    <h2 className="text-2xl font-semibold text-slate-900">Lifts</h2>
                    <div className="grid gap-3">
                        {lifts.map((lift) => (
                            <Button
                                key={lift.id}
                                variant={selectedLift === lift.id ? "default" : "outline"}
                                onClick={() => setSelectedLift(lift.id)}
                                className={`w-full p-6 justify-between group hover:shadow-md
                  ${selectedLift === lift.id ? 'ring-2 ring-offset-2 ring-slate-900' : ''}
                  transition-all duration-300`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{typeIcons[lift.type]}</span>
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{lift.name}</span>
                                        <span className="text-sm text-slate-600">{lift.waitTime} min wait</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary" className={difficultyColors[lift.difficulty]}>
                                        {lift.difficulty}
                                    </Badge>
                                    <Badge variant="secondary" className={statusColors[lift.status]}>
                                        {lift.status}
                                    </Badge>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}