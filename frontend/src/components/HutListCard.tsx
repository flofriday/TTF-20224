import { Hut } from '@/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Coffee, Utensils, Beer, Home, Users } from 'lucide-react'

interface HutListCardProps {
    huts: Hut[]
    selectedHut: Hut | null
    onHutSelect: (hut: Hut) => void
}

const typeIcons = {
    'restaurant': <Utensils className="w-4 h-4" />,
    'cafe': <Coffee className="w-4 h-4" />,
    'bar': <Beer className="w-4 h-4" />,
    'alpine_hut': <Home className="w-4 h-4" />,
    'wilderness_hut': <Home className="w-4 h-4" />
}

const getSeatsColor = (freeSeats: number) => {
    if (freeSeats >= 50) return 'bg-green-500'
    if (freeSeats >= 10) return 'bg-yellow-500'
    return 'bg-red-500'
}

export function HutListCard({ huts, selectedHut, onHutSelect }: HutListCardProps) {
    const sortedHuts = [...huts].sort((a, b) => {
        if (a.status === 'closed' && b.status !== 'closed') return 1
        if (a.status !== 'closed' && b.status === 'closed') return -1
        if (a.status === 'open' && b.status === 'open') {
            return b.free_seats - a.free_seats
        }
        return a.name.localeCompare(b.name)
    })

    const openHuts = huts.filter(h => h.status === 'open')
    const totalFreeSeats = openHuts.reduce((sum, hut) => sum + hut.free_seats, 0)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Mountain Huts</h2>
                <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {openHuts.length} open
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {totalFreeSeats} seats available
                    </Badge>
                </div>
            </div>

            <div className="grid gap-3">
                {sortedHuts.map((hut) => (
                    <HoverCard key={hut.id}>
                        <HoverCardTrigger asChild>
                            <div
                                onClick={() => onHutSelect(hut)}
                                className={`p-4 rounded-lg w-full group hover:shadow-md border-2
                                    ${selectedHut?.id === hut.id ? 'bg-gray-200 dark:bg-slate-800 border-slate-700' : 'border-transparent'}
                                    transition-all duration-300 cursor-pointer`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">
                                            {typeIcons[hut.type] || <Home className="w-4 h-4" />}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{hut.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hut.status === 'open' ? (
                                            <Badge variant="secondary" className="rounded-full">
                                                {hut.free_seats} seats
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="rounded-full bg-slate-500 text-white">
                                                closed
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {hut.status === 'open' && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                            <span>Capacity</span>
                                            <span>{Math.min(Math.round((hut.free_seats / 100) * 100), 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className={`h-full rounded-full transition-all ${getSeatsColor(hut.free_seats)}`}
                                                style={{
                                                    width: `${Math.min((hut.free_seats / 100) * 100, 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{hut.name}</h4>
                                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    <p>Type: {hut.type.replace('_', ' ')}</p>
                                    <p>Status: {hut.status}</p>
                                    <p>Elevation: {hut.elevation}m</p>
                                    {hut.status === 'open' && (
                                        <p>Available Seats: {hut.free_seats}</p>
                                    )}
                                    {hut.description && (
                                        <p className="text-xs mt-2">{hut.description}</p>
                                    )}
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                ))}

                {huts.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No huts found for this resort
                    </div>
                )}
            </div>
        </div>
    )
} 