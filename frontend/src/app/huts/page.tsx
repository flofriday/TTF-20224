'use client'

import { useState, useEffect } from 'react'
import { MapView } from '@/components/MapView'
import { HutList } from '@/components/HutList'
import { Hut } from '@/types'
import { ResortSelector } from '@/components/ResortSelector'
import { useSearchParams, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { getResorts, getResortHuts } from '@/lib/api'
import { SkiResort } from '@/types/resort'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function HutsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [huts, setHuts] = useState<Hut[]>([])
    const [selectedHut, setSelectedHut] = useState<Hut | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedResort, setSelectedResort] = useState<SkiResort | null>(null)
    const [resorts, setResorts] = useState<SkiResort[]>([])
    const [error, setError] = useState<string | null>(null)

    // Initialize selected resort from URL parameter
    useEffect(() => {
        const fetchResorts = async () => {
            setLoading(true)
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
                    router.replace(`/huts?resort=${initialResort.id}`, { scroll: false })
                } else if (data.length > 0) {
                    setSelectedResort(data[0])
                    router.replace(`/huts?resort=${data[0].id}`, { scroll: false })
                } else {
                    setError('No resorts available')
                }
            } catch (err) {
                console.error('Failed to fetch resorts:', err)
                setError('Failed to load resorts')
            } finally {
                setLoading(false)
            }
        }
        fetchResorts()
    }, [])

    // Fetch huts when selected resort changes
    useEffect(() => {
        if (!selectedResort) return

        const fetchHuts = async () => {
            setLoading(true)
            try {
                const data = await getResortHuts(selectedResort.id)
                // Parse the coordinates string for each hut
                const hutsWithParsedCoords = data.map(hut => ({
                    ...hut,
                    coordinates: JSON.parse(hut.coordinates)
                }))
                setHuts(hutsWithParsedCoords)
                setError(null)
            } catch (err) {
                console.error('Failed to fetch huts:', err)
                setError('Failed to load huts')
                setHuts([])
            } finally {
                setLoading(false)
            }
        }

        fetchHuts()
    }, [selectedResort])

    const handleResortChange = (resortId: string) => {
        const resort = resorts.find(r => String(r.id) === String(resortId))
        if (resort) {
            setSelectedResort(resort)
            router.replace(`/huts?resort=${resortId}`, { scroll: false })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        )
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <main className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-5xl">
                {/* Back button */}
                <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Lifts
                </Link>

                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Mountain Huts</h1>
                    <p className="text-slate-600 dark:text-slate-400">Find available seats and refreshments</p>
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

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <MapView
                                    selectedHut={selectedHut}
                                    onHutSelect={setSelectedHut}
                                    huts={huts}
                                    resortId={selectedResort.id}
                                />
                            </div>
                            <div className="w-80">
                                <HutList
                                    huts={huts}
                                    selectedHut={selectedHut}
                                    onHutSelect={setSelectedHut}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
