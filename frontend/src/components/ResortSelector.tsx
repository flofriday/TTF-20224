'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkiResort } from "@/types/resort"
import { MapPin } from 'lucide-react'
import { cn } from "@/lib/utils"

interface ResortSelectorProps {
    resorts: SkiResort[]
    selectedResort: SkiResort | null
    onResortChange: (resortId: number) => void
}

export function ResortSelector({ resorts, selectedResort, onResortChange }: ResortSelectorProps) {
    return (
        <div className="w-full max-w-md mx-auto">
            <Select
                value={selectedResort?.id?.toString() || undefined}
                onValueChange={onResortChange}
            >
                <SelectTrigger className="w-full bg-white dark:bg-slate-800 h-12 px-4 rounded-lg border-2 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <SelectValue placeholder="Choose a resort">
                            {selectedResort?.name || 'Choose a resort'}
                        </SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {resorts.map((resort) => (
                        <SelectItem
                            key={resort.id}
                            value={resort.id.toString()}
                            className={cn(
                                "py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700",
                                selectedResort?.id === resort.id && "bg-slate-100 dark:bg-slate-700"
                            )}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{resort.name}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {resort.snow_depth}cm • {resort.weather_conditions}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
} 