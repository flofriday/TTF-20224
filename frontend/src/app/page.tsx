'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { getLifts, getSkiMap, getResorts, getResortLifts, getResortMap } from '@/lib/api'
import { Lift } from '@/types/lift'
import { drawLiftLine } from '@/lib/utils'
import { Map } from '@/components/Map'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from 'next-themes'
import { SkiResort } from '@/types/resort'
import { ResortSelector } from '@/components/ResortSelector'
import { useSearchParams, useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import Link from 'next/link'

const typeIcons = {
    'express': '⚡',        // Express lift
    'quad': '4️⃣',          // Quad lift
    'chair_lift': '🪑',         // Chair lift
    'mixed_lift': '🚠',    // Mixed lift (usually gondola + chair)
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
    'beginner': 'bg-emerald-500 text-white',
    'intermediate': 'bg-blue-400 text-white',
    'advanced': 'bg-black text-white'
}

const statusColors = {
    open: 'bg-teal-600 text-white',
    closed: 'bg-slate-500 text-white'
}

export default function Home() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedLift, setSelectedLift] = useState<string | null>(null)
    const [selectedResort, setSelectedResort] = useState<SkiResort | null>(null)
    const [resorts, setResorts] = useState<SkiResort[]>([])
    const [lifts, setLifts] = useState<Lift[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mapUrl, setMapUrl] = useState<string | null>(null)
    const { theme } = useTheme()
    const [isStylesLoaded, setIsStylesLoaded] = useState(false)
    const [zoomToLift, setZoomToLift] = useState<string | null>(null)

    // Initialize selected resort from URL parameter
    useEffect(() => {
        const fetchResorts = async () => {
            setIsLoading(true)
            try {
                const data = await getResorts()
                setResorts(data)

                // Get resort ID from URL or default to first resort
                const resortId = searchParams.get('resort')
                const initialResort = resortId
                    ? data.find(r => String(r.id) === String(resortId))
                    : data[0]

                if (initialResort) {
                    setSelectedResort(initialResort)
                    // Ensure URL always reflects the current resort
                    router.replace(`?resort=${initialResort.id}`, { scroll: false })
                } else {
                    // If no valid resort found, default to first resort
                    if (data.length > 0) {
                        setSelectedResort(data[0])
                        router.replace(`?resort=${data[0].id}`, { scroll: false })
                    } else {
                        setError('No resorts available')
                    }
                }
            } catch (err) {
                console.error('Failed to fetch resorts:', err)
                setError('Failed to load resorts')
            } finally {
                setIsLoading(false)
            }
        }
        fetchResorts()
    }, [])

    // Update URL when resort changes (via selector)
    const handleResortChange = useCallback((resortId: string) => {
        const resort = resorts.find(r => String(r.id) === String(resortId))
        if (resort) {
            setSelectedResort(resort)
            router.replace(`?resort=${resortId}`, { scroll: false })
        } else {
            console.error('Resort not found:', resortId)
        }
    }, [resorts])

    // Fetch lifts and map when selected resort changes
    useEffect(() => {
        if (!selectedResort || isLoading) return

        const fetchResortData = async () => {
            try {
                setIsLoading(true)
                setLifts([]) // Clear existing lifts while loading
                const [liftsData, mapUrlData] = await Promise.all([
                    getResortLifts(selectedResort.id),
                    getResortMap(selectedResort.id)
                ])
                setLifts(liftsData)
                setMapUrl(mapUrlData)
                setSelectedLift(null) // Reset selected lift when changing resorts
                setError(null)
            } catch (err) {
                console.error('Failed to fetch resort data:', err)
                setError('Failed to load resort data')
                setLifts([]) // Clear lifts on error
            } finally {
                setIsLoading(false)
            }
        }

        fetchResortData()
        return () => {
            if (mapUrl) {
                URL.revokeObjectURL(mapUrl)
            }
        }
    }, [selectedResort])

    // Add styles loaded check
    useEffect(() => {
        // Check if stylesheets are loaded
        const styleSheets = document.styleSheets
        if (styleSheets.length > 0) {
            setIsStylesLoaded(true)
        } else {
            const observer = new MutationObserver((mutations) => {
                if (document.styleSheets.length > 0) {
                    setIsStylesLoaded(true)
                    observer.disconnect()
                }
            })

            observer.observe(document.head, {
                childList: true,
                subtree: true
            })

            return () => observer.disconnect()
        }
    }, [])

    // Combine loading states
    if (!isStylesLoaded || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        )
    }

    // Error handling
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center space-y-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    const handleLiftSelect = (liftId: string) => {
        setSelectedLift(liftId)
        setZoomToLift(liftId) // Trigger zoom when selecting a lift
    }

    // Sort lifts - moved outside of useMemo for simplicity
    const sortedLifts = [...lifts].sort((a, b) => {
        // First sort by status (closed goes to bottom)
        if (a.status === 'closed' && b.status !== 'closed') return 1
        if (a.status !== 'closed' && b.status === 'closed') return -1

        // Then sort by wait time for open lifts
        if (a.wait_time === undefined) return 1
        if (b.wait_time === undefined) return -1
        return (a.wait_time || 0) - (b.wait_time || 0)
    })

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <main className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-5xl">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">SlopeFlow</h1>
                    <p className="text-slate-600 dark:text-slate-400">Find unused slopes</p>
                </div>

                <div className="relative">
                    <ResortSelector
                        resorts={resorts}
                        selectedResort={selectedResort}
                        onResortChange={handleResortChange}
                    />
                </div>

                {selectedResort && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold">{selectedResort.name}</h2>
                            <div className="flex gap-2">
                                <Badge variant="secondary">
                                    Snow: {selectedResort.snow_depth}cm
                                </Badge>
                                <Badge variant="secondary">
                                    {selectedResort.weather_conditions}
                                </Badge>
                            </div>
                        </div>

                        <Map
                            lifts={lifts}
                            selectedLift={selectedLift}
                            mapUrl={mapUrl}
                            statusColors={statusColors}
                            typeIcons={typeIcons}
                            difficultyColors={difficultyColors}
                            onLiftSelect={setSelectedLift}
                            isDarkMode={theme === 'dark'}
                            zoomToLift={zoomToLift}
                            onZoomComplete={() => setZoomToLift(null)}
                        />

                        {/* Status Legend */}
                        <div className="flex gap-6 justify-center flex-wrap py-2">
                            {Object.entries(statusColors).map(([status, color]) => (
                                <div key={status} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color.split(' ')[0]}`} />
                                    <span className="capitalize text-sm text-slate-600 dark:text-slate-400">{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lift List */}
                <div className="grid gap-4">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Lifts</h2>
                    <div className="grid gap-3">
                        {sortedLifts.map((lift) => (
                            <HoverCard key={lift.id}>
                                <HoverCardTrigger asChild>
                                    <div
                                        onClick={() => handleLiftSelect(lift.id)}
                                        className={`p-4 rounded-lg w-full justify-between group hover:shadow-md border-2
                                            ${selectedLift === lift.id ? 'bg-gray-200 border-slate-700' : ''}
                                            transition-all duration-300 cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{typeIcons[lift.type]}</span>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{lift.name}</span>
                                                <span className="text-sm text-slate-600">
                                                    {lift.status === 'closed'
                                                        ? 'Currently closed'
                                                        : `Estimated wait time: ${lift.wait_time} min`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pt-2 flex gap-1 items-center">
                                            <Badge variant="secondary" className={`rounded-full ${statusColors[lift.status]}`}>
                                                {lift.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">{lift.name}</h4>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <p>Type: {lift.type}</p>
                                            <p>Status: {lift.status}</p>
                                            <p>
                                                {lift.status === 'closed'
                                                    ? 'Wait Time: Indefinitely'
                                                    : `Wait Time: ${lift.wait_time} minutes`
                                                }
                                            </p>
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

            </main >

            <div className="fixed bottom-4 right-4">
                <Link href="/camera">
                    <Button size="icon" className="rounded-full h-12 w-12">
                        <Camera className="h-6 w-6" />
                        <span className="sr-only">Open Camera</span>
                    </Button>
                </Link>
            </div>
        </div >
    )
}