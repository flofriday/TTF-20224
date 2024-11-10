import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Hut } from '@/types'
import { Home, Coffee, Utensils, Beer } from 'lucide-react'

interface MapViewProps {
    selectedHut: Hut | null;
    onHutSelect: (hut: Hut) => void;
    huts: Hut[];
    resortId: number;
}

const typeIcons = {
    'restaurant': <Utensils className="w-5 h-5" />,
    'cafe': <Coffee className="w-5 h-5" />,
    'bar': <Beer className="w-5 h-5" />,
    'alpine_hut': <Home className="w-5 h-5" />,
    'wilderness_hut': <Home className="w-5 h-5" />
}

export function MapView({ selectedHut, onHutSelect, huts, resortId }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const updateDimensions = () => {
            if (mapRef.current) {
                setMapDimensions({
                    width: mapRef.current.offsetWidth,
                    height: mapRef.current.offsetHeight
                })
            }
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    return (
        <div ref={mapRef} className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            <Image
                src={`/api/ski-resorts/${resortId}/map`}
                alt="Ski Resort Map"
                fill
                className="object-cover"
                priority
                unoptimized
            />

            {huts.map((hut) => {
                // Parse coordinates if they're stored as a string
                const coords = typeof hut.coordinates === 'string'
                    ? JSON.parse(hut.coordinates)
                    : hut.coordinates

                // Calculate position as percentage of map dimensions
                const x = (coords[0] / 1600) * 100 // 1600 is the original map width
                const y = (coords[1] / 1200) * 100 // 1200 is the original map height

                return (
                    <div
                        key={hut.id}
                        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2
                            ${selectedHut?.id === hut.id
                                ? 'text-red-500 scale-125'
                                : hut.status === 'open'
                                    ? 'text-green-500'
                                    : 'text-slate-400'
                            }
                            transition-all duration-200 hover:scale-110
                            group`}
                        style={{
                            left: `${x}%`,
                            top: `${y}%`
                        }}
                        onClick={() => onHutSelect(hut)}
                    >
                        {/* Icon */}
                        <div className="relative">
                            {typeIcons[hut.type] || <Home className="w-5 h-5" />}

                            {/* Available seats indicator */}
                            {hut.status === 'open' && hut.free_seats > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                            )}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2
                            opacity-0 group-hover:opacity-100 transition-opacity z-10
                            pointer-events-none"
                        >
                            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg
                                text-sm whitespace-nowrap text-slate-900 dark:text-slate-100"
                            >
                                <div className="font-medium">{hut.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {hut.elevation}m · {hut.type.replace('_', ' ')}
                                </div>
                                {hut.status === 'open' && (
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                        {hut.free_seats} seats available
                                    </div>
                                )}
                            </div>
                            {/* Tooltip arrow */}
                            <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1
                                border-8 border-transparent border-t-white dark:border-t-slate-800" />
                        </div>
                    </div>
                )
            }
            )}
        </div>
    )
}
