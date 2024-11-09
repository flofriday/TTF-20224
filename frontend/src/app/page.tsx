'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { getLifts, getSkiMap } from '@/lib/api'
import { Lift } from '@/types/lift'
import { drawLiftLine } from '@/lib/utils'
import { Map } from '@/components/Map'
import { ThemeToggle } from '@/components/theme-toggle'

const statusColors = {
    open: 'bg-emerald-500 text-white',
    closed: 'bg-red-500 text-white',
    hold: 'bg-amber-500 text-white'
}

const typeIcons = {
    'express': '⚡',        // Express lift
    'quad': '4️⃣',          // Quad lift
    'chair_lift': '🪑',         // Chair lift
    'mixed_lift': '🪑+🚡',    // Mixed lift (usually gondola + chair)
    'gondola': '🚡',       // Gondola
    't-bar': '⊤',         // T-bar
    'platter': '🍽️',       // Platter/button lift
    'drag-lift': '↟',     // Generic drag lift
    'magic_carpet': '🔮',  // Magic carpet
    'station': '🏠',      // Station/terminal
    'goods': '📦',        // Goods lift
    'drag_lift': '↟',     // Drag lift
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
    const [mapUrl, setMapUrl] = useState<string | null>(null)

    useEffect(() => {
        const fetchLifts = async () => {
            try {
                setIsLoading(true)
                const data = await getLifts()
                console.log('Received lift data:', data)
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

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const url = await getSkiMap()
                setMapUrl(url)
            } catch (err) {
                console.error('Failed to fetch map:', err)
                setError('Failed to load map')
            }
        }

        fetchMap()

        return () => {
            // Cleanup object URL when component unmounts
            if (mapUrl) {
                URL.revokeObjectURL(mapUrl)
            }
        }
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <main className="container mx-auto p-6 space-y-8 max-w-5xl">
                    <Card className="p-8">
                        <p className="text-center text-slate-600 dark:text-slate-400">Loading lift data...</p>
                    </Card>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <main className="container mx-auto p-6 space-y-8 max-w-5xl">
                    <Card className="p-8">
                        <p className="text-center text-red-600 dark:text-red-400">{error}</p>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <main className="container mx-auto p-6 space-y-8 max-w-5xl">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">SlopeFlow</h1>
                    <p className="text-slate-600 dark:text-slate-400">Find unused slopes</p>
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

                <Map
                    lifts={lifts}
                    selectedLift={selectedLift}
                    mapUrl={mapUrl}
                    statusColors={statusColors}
                    typeIcons={typeIcons}
                    difficultyColors={difficultyColors}
                    onLiftSelect={setSelectedLift}
                />

                {/* Updated Lift List with HoverCard */}
                <div className="grid gap-4">
                    <h2 className="text-2xl font-semibold text-slate-900">Lifts</h2>
                    <div className="grid gap-3">
                        {lifts.map((lift) => (
                            <HoverCard key={lift.id}>
                                <HoverCardTrigger asChild>
                                    <Button
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
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">{lift.name}</h4>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <p>Type: {lift.type}</p>
                                            <p>Status: {lift.status}</p>
                                            <p>Wait Time: {lift.waitTime} minutes</p>
                                            <p>Difficulty: {lift.difficulty}</p>
                                            {lift.description && (
                                                <p className="text-xs mt-2">{lift.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}