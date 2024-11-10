'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Lift } from '@/types/lift'
import { drawLiftLine } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'


interface MapProps {
    lifts: Lift[]
    selectedLift: string | null
    mapUrl: string | null
    statusColors: Record<string, string>
    typeIcons: Record<string, string>
    difficultyColors: Record<string, string>
    onLiftSelect?: (liftId: string) => void
    isDarkMode?: boolean
    zoomToLift?: string | null
    onZoomComplete?: () => void
}

// Add constants for the base image dimensions
const BASE_WIDTH = 1600
const BASE_HEIGHT = 1200

// Add new state variables after the BASE constants
const MIN_ZOOM = 1
const MAX_ZOOM = 4



export function Map({ lifts, selectedLift, mapUrl, statusColors, typeIcons, difficultyColors, onLiftSelect, isDarkMode, zoomToLift, onZoomComplete }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })

    const ORIGINAL_WIDTH = 1600
    const ORIGINAL_HEIGHT = 1200

    // Handle zooming
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const delta = e.deltaY * -0.01
        const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM)

        // Calculate new pan position to keep the point under cursor in the same position
        const newPan = {
            x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
            y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
        }

        setZoom(newZoom)
        setPan(newPan)
    }, [zoom, pan])

    // Mouse event handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setStartPan({ ...pan })
        e.preventDefault()
    }, [pan])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return

        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        setPan({
            x: startPan.x + deltaX,
            y: startPan.y + deltaY
        })
        e.preventDefault()
    }, [isDragging, dragStart.x, dragStart.y, startPan])

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        setIsDragging(false)
        e.preventDefault()
    }, [])

    // Effect to handle zoom to lift
    useEffect(() => {
        if (!zoomToLift || !containerRef.current) return

        const lift = lifts.find(l => l.id === zoomToLift)
        if (!lift) return

        const path = typeof lift.path === 'string' ? JSON.parse(lift.path) : lift.path
        if (!path || path.length === 0) return

        const containerRect = containerRef.current.getBoundingClientRect()

        // Find the bounds of the lift path
        let minX = Math.min(...path.map(p => p[0]))
        let maxX = Math.max(...path.map(p => p[0]))
        let minY = Math.min(...path.map(p => p[1]))
        let maxY = Math.max(...path.map(p => p[1]))

        // Calculate center point of the lift
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        // Calculate lift dimensions
        const liftWidth = maxX - minX
        const liftHeight = maxY - minY

        // Calculate zoom level to fit the lift with padding
        const padding = 100 // pixels
        const scaleX = containerRect.width / (liftWidth * (containerRect.width / ORIGINAL_WIDTH))
        const scaleY = containerRect.height / (liftHeight * (containerRect.height / ORIGINAL_HEIGHT))
        const newZoom = Math.min(
            Math.max(Math.min(scaleX, scaleY) * 0.8, MIN_ZOOM),
            MAX_ZOOM
        )

        // Calculate pan to center the lift
        const newPan = {
            x: (containerRect.width / 2) - (centerX * (containerRect.width / ORIGINAL_WIDTH) * newZoom),
            y: (containerRect.height / 2) - (centerY * (containerRect.height / ORIGINAL_HEIGHT) * newZoom)
        }

        setZoom(newZoom)
        setPan(newPan)

        // Notify parent that zoom is complete
        setTimeout(() => {
            onZoomComplete?.()
        }, 300)
    }, [zoomToLift, lifts, onZoomComplete])

    // Reset function
    const handleReset = useCallback((e: React.MouseEvent) => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        e.stopPropagation()
    }, [])

    const drawLifts = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const colorMap: Record<string, string> = {
            'bg-teal-600': isDarkMode ? '2DD4BF' : '0D9488',    // teal for operating
            'bg-slate-500': isDarkMode ? '94A3B8' : '64748B',   // grey for closed
        }

        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        const scaleX = rect.width / BASE_WIDTH
        const scaleY = rect.height / BASE_HEIGHT

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        lifts.filter(lift => lift.type !== 'station').forEach(lift => {
            const path = typeof lift.path === 'string' ? JSON.parse(lift.path) : lift.path
            const isSelected = selectedLift === lift.id

            const scaledPath = path.map((point: number[]) => [
                point[0] * scaleX,
                point[1] * scaleY
            ])

            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            const statusColorClass = statusColors[lift.status].split(' ')[0]
            const lineColor = colorMap[statusColorClass] || (isDarkMode ? 'FFFFFF' : '000000')

            const lineWidth = isSelected ? 2 : 1
            const lineOpacity = isSelected ? 1 : 0.7

            ctx.globalAlpha = lineOpacity
            drawLiftLine(ctx, scaledPath, lineColor, isSelected, lineWidth, isDarkMode, zoom)
            ctx.globalAlpha = 1
        })
    }, [lifts, selectedLift, isDarkMode, statusColors, zoom])
    // Effect to redraw on zoom changes
    useEffect(() => {
        drawLifts()
    }, [drawLifts, zoom])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [handleWheel])
    return (
        <Card
            ref={containerRef}
            className={`relative w-full aspect-[4/3] overflow-hidden shadow-xl touch-none
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className="absolute inset-0 transition-transform duration-300 ease-out"
                style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transformOrigin: '0 0'
                }}
            >
                {mapUrl && (
                    <img
                        src={mapUrl}
                        alt="Ski Map"
                        className={`absolute inset-0 w-full h-full object-contain
                            ${isDarkMode ? 'invert brightness-[.85] hue-rotate-180' : ''}`}
                        onLoad={drawLifts}
                    />
                )}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                    width={containerRef.current?.clientWidth}
                    height={containerRef.current?.clientHeight}
                />
            </div>

            {zoom !== 1 && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-opacity-75 hover:bg-opacity-100"
                    onClick={handleReset}
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            )}
        </Card>
    )
}
