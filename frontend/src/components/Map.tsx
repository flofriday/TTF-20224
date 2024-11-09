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
    onLiftSelect?: (liftId: string) => void
    isDarkMode?: boolean
}

// Add constants for the base image dimensions
const BASE_WIDTH = 1600
const BASE_HEIGHT = 1200

export function Map({ lifts, selectedLift, mapUrl, statusColors, typeIcons, difficultyColors, onLiftSelect, isDarkMode }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Function to draw all lift lines
    const drawLifts = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Get current container dimensions
        const rect = container.getBoundingClientRect()

        // Update canvas dimensions to match container
        canvas.width = rect.width
        canvas.height = rect.height

        // Make canvas transparent instead of filling with a background color
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate scale factors based on current dimensions
        const scaleX = canvas.width / BASE_WIDTH
        const scaleY = canvas.height / BASE_HEIGHT

        // Color mapping from Tailwind classes to hex colors
        const colorMap: Record<string, string> = {
            'bg-teal-600': isDarkMode ? '2DD4BF' : '0D9488',    // teal for operating
            'bg-slate-500': isDarkMode ? '94A3B8' : '64748B',   // grey for closed
        }

        // Draw each lift line, excluding stations
        lifts.filter(lift => lift.type !== 'station').forEach(lift => {
            const path = typeof lift.path === 'string' ? JSON.parse(lift.path) : lift.path
            const isSelected = selectedLift === lift.id

            // Scale the path coordinates
            const scaledPath = path.map((point: number[]) => [
                point[0] * scaleX,
                point[1] * scaleY
            ])

            // Set line properties
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            // Get the base status color class
            const statusColorClass = statusColors[lift.status].split(' ')[0]
            const lineColor = colorMap[statusColorClass] || (isDarkMode ? 'FFFFFF' : '000000')

            const lineWidth = isSelected ? 2 : 1
            const lineOpacity = isSelected ? 1 : 0.7

            ctx.globalAlpha = lineOpacity
            drawLiftLine(ctx, scaledPath, lineColor, isSelected, lineWidth, isDarkMode)
            ctx.globalAlpha = 1
        })
    }, [lifts, selectedLift, isDarkMode, statusColors])

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
            className={`relative w-full aspect-[4/3] overflow-hidden shadow-xl
                ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
        >
            {mapUrl && (
                <img
                    src={mapUrl}
                    alt="Ski Map"
                    className={`absolute inset-0 w-full h-full object-contain transition-all duration-300
                        ${isDarkMode ? 'invert brightness-[.85] hue-rotate-180' : ''}`}
                    onLoad={updateCanvasSize}
                />
            )}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
            />
        </Card>
    )
}
