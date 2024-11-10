import { Lift } from '@/types/lift'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Timer, Users } from 'lucide-react'

interface LiftListCardProps {
    lifts: Lift[]
    selectedLift: Lift | null
    onLiftSelect: (lift: Lift) => void
}

const difficultyColors = {
    'beginner': 'bg-green-500',
    'intermediate': 'bg-blue-500',
    'advanced': 'bg-black'
}

const statusColors = {
    'open': 'bg-green-500',
    'closed': 'bg-red-500',
    'hold': 'bg-yellow-500'
}

export function LiftListCard({ lifts, selectedLift, onLiftSelect }: LiftListCardProps) {
    const sortedLifts = [...lifts].sort((a, b) => {
        if (a.status === 'closed' && b.status !== 'closed') return 1
        if (a.status !== 'closed' && b.status === 'closed') return -1
        if (a.status === 'hold' && b.status === 'open') return 1
        if (a.status === 'open' && b.status === 'hold') return -1
        return a.wait_time - b.wait_time
    })

    const openLifts = lifts.filter(l => l.status === 'open')
    const averageWaitTime = openLifts.length > 0
        ? Math.round(openLifts.reduce((sum, lift) => sum + lift.wait_time, 0) / openLifts.length)
        : 0

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Lifts</h2>
                <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {openLifts.length} open
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {averageWaitTime}min avg
                    </Badge>
                </div>
            </div>

            <div className="grid gap-3">
                {sortedLifts.map((lift) => (
                    <HoverCard key={lift.id}>
                        <HoverCardTrigger asChild>
                            <div
                                onClick={() => onLiftSelect(lift)}
                                className={`p-4 rounded-lg w-full justify-between group hover:shadow-md border-2
                                    ${selectedLift?.id === lift.id ? 'bg-gray-200 dark:bg-slate-800 border-slate-700' : 'border-transparent'}
                                    transition-all duration-300 cursor-pointer`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-8 rounded-full ${difficultyColors[lift.difficulty]}`} />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{lift.name}</span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {lift.type.replace('-', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-1 items-center">
                                    <Badge variant="secondary">
                                        {lift.status === 'open'
                                            ? `${lift.wait_time}min wait`
                                            : lift.status}
                                    </Badge>
                                    <div className={`w-2 h-2 rounded-full ${statusColors[lift.status]}`} />
                                </div>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{lift.name}</h4>
                                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    <p>Type: {lift.type.replace('-', ' ')}</p>
                                    <p>Status: {lift.status}</p>
                                    <p>Difficulty: {lift.difficulty}</p>
                                    {lift.status === 'open' && (
                                        <>
                                            <p>Wait Time: {lift.wait_time} minutes</p>
                                            <p>Capacity: {lift.capacity} per hour</p>
                                            <p>Current Load: {lift.currentLoad}%</p>
                                        </>
                                    )}
                                    {lift.description && (
                                        <p className="text-xs mt-2">{lift.description}</p>
                                    )}
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                ))}

                {lifts.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No lifts found for this resort
                    </div>
                )}
            </div>
        </div>
    )
}
