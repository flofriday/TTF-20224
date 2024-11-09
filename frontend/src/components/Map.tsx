'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Lift } from '@/types/lift'
import { drawLiftLine } from '@/lib/utils'

interface MapProps {
    lifts: Lift[]
    selectedLift: string | null
    mapUrl: string | null
    statusColors: Record<string, string>
    typeIcons: Record<string, string>
    difficultyColors: Record<string, string>
}

// Add constants for the base image dimensions
const BASE_WIDTH = 1600
const BASE_HEIGHT = 1200

export function Map({ lifts, selectedLift, mapUrl, statusColors, typeIcons, difficultyColors }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Function to draw all lift lines
    const drawLifts = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate scale factors
        const scaleX = canvas.width / BASE_WIDTH
        const scaleY = canvas.height / BASE_HEIGHT

        // Draw each lift line
        lifts.forEach(lift => {
            const path = typeof lift.path === 'string' ? JSON.parse(lift.path) : lift.path
            const isSelected = selectedLift === lift.id

            // Scale the path coordinates
            const scaledPath = path.map((point: number[]) => [
                point[0] * scaleX,
                point[1] * scaleY
            ])

            // Get status color without the text color class
            const statusColor = statusColors[lift.status].split(' ')[0]
            const color = statusColor.replace('bg-', '')

            drawLiftLine(ctx, scaledPath, color, isSelected, 1) // Remove scale factor as we're pre-scaling
        })
    }, [lifts, selectedLift, statusColors])

    // Function to update canvas size
    const updateCanvasSize = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
        drawLifts()
    }, [drawLifts])

    // Effect to handle canvas resize
    useEffect(() => {
        updateCanvasSize()
        window.addEventListener('resize', updateCanvasSize)
        return () => window.removeEventListener('resize', updateCanvasSize)
    }, [updateCanvasSize])

    // Effect to redraw canvas when selected lift or lifts change
    useEffect(() => {
        drawLifts()
    }, [selectedLift, lifts, drawLifts])

    // Add a function to calculate the correct position
    const calculatePosition = useCallback((point: number[]) => {
        const container = containerRef.current
        if (!container) return { left: 0, top: 0 }

        const rect = container.getBoundingClientRect()
        const scaleX = rect.width / BASE_WIDTH
        const scaleY = rect.height / BASE_HEIGHT

        return {
            left: point[0] * scaleX,
            top: point[1] * scaleY
        }
    }, [])

    return (
        <Card
            ref={containerRef}
            className="relative w-full aspect-[4/3] overflow-hidden shadow-xl bg-white"
        >
            {mapUrl && (
                <img
                    src={mapUrl}
                    alt="Ski Map"
                    className="absolute inset-0 w-full h-full object-contain"
                    onLoad={updateCanvasSize}
                />
            )}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
            />

            {/* Lift Markers */}
            {lifts.map((lift) => {
                const path = typeof lift.path === 'string' ? JSON.parse(lift.path) : lift.path
                const lastPoint = path[path.length - 1]
                const position = calculatePosition(lastPoint)

                return (
                    <HoverCard key={lift.id}>
                        <HoverCardTrigger>
                            <div
                                className={`absolute cursor-pointer transition-all duration-300
                                ${selectedLift === lift.id ? 'scale-150 z-20' : 'scale-100 z-10'}`}
                                style={{
                                    left: `${position.left}px`,
                                    top: `${position.top}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <div className={`w-6 h-6 rounded-full ${statusColors[lift.status].split(' ')[0]} 
                                    shadow-lg flex items-center justify-center
                                    border-2 border-white`}>
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
                )
            })}
        </Card>
    )
}
