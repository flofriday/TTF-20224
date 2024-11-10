import { Hut } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coffee, Utensils, Beer, Home, Users } from 'lucide-react'

interface HutListProps {
    huts: Hut[];
    selectedHut: Hut | null;
    onHutSelect: (hut: Hut) => void;
}

const typeIcons = {
    'restaurant': <Utensils className="w-4 h-4" />,
    'cafe': <Coffee className="w-4 h-4" />,
    'bar': <Beer className="w-4 h-4" />,
    'alpine_hut': <Home className="w-4 h-4" />,
    'wilderness_hut': <Home className="w-4 h-4" />
}

export function HutList({ huts, selectedHut, onHutSelect }: HutListProps) {
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
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Mountain Huts
                </h2>
                <div className="flex gap-2 text-sm">
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

            <div className="space-y-3">
                {sortedHuts.map((hut) => (
                    <Card
                        key={hut.id}
                        className={`p-3 cursor-pointer transition-all hover:shadow-md
                            ${selectedHut?.id === hut.id ? 'ring-2 ring-blue-500' : ''}
                        `}
                        onClick={() => onHutSelect(hut)}
                    >
                        <div className="space-y-2">
                            {/* Main row with fixed layout */}
                            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 min-w-0">
                                <div className="flex-shrink-0">
                                    {typeIcons[hut.type] || <Home className="w-4 h-4" />}
                                </div>
                                <h3 className="font-medium truncate">
                                    {hut.name}
                                </h3>
                                <Badge
                                    variant={hut.status === 'open' ? 'success' : 'secondary'}
                                    className="capitalize whitespace-nowrap flex-shrink-0"
                                >
                                    {hut.status === 'open' ? (
                                        <span className="flex items-center gap-1">
                                            {hut.free_seats} seats
                                        </span>
                                    ) : 'closed'}
                                </Badge>
                            </div>

                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex justify-between items-center">
                                    <span>{hut.elevation}m elevation</span>
                                    <span className="text-xs capitalize">{hut.type.replace('_', ' ')}</span>
                                </div>

                                {hut.status === 'open' && (
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                                        <div
                                            className={`h-full rounded-full transition-all
                                                ${hut.free_seats > 20 ? 'bg-green-500' :
                                                    hut.free_seats > 10 ? 'bg-yellow-500' :
                                                        'bg-orange-500'}`}
                                            style={{
                                                width: `${Math.min((hut.free_seats / 30) * 100, 100)}%`
                                            }}
                                        />
                                    </div>
                                )}

                                {hut.description && (
                                    <p className="text-xs italic mt-1 truncate">
                                        {hut.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {huts.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No huts found for this resort
                </div>
            )}
        </div>
    )
} 