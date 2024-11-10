'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Lift } from '@/types/lift'
import { drawLiftLine } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Hut } from '@/types'

interface MapProps {
    lifts: Lift[]
    selectedLift: Lift | null
    huts: Hut[]
    selectedHut: Hut | null
    mapUrl: string
    statusColors: Record<string, string>
    typeIcons: Record<string, JSX.Element>
    difficultyColors: Record<string, string>
    onLiftSelect: (lift: Lift) => void
    onHutSelect: (hut: Hut) => void
    isDarkMode: boolean
    zoomToLift: string | null
    zoomToHut: number | null
    onZoomComplete: () => void
}

// Add constants for the base image dimensions
const BASE_WIDTH = 1600
const BASE_HEIGHT = 1200

// Add new state variables after the BASE constants
const MIN_ZOOM = 1
const MAX_ZOOM = 4

// Add these constants near the other ones
const HUT_ZOOM_THRESHOLD = 4
const HUT_MARKER_SIZE = 12



export function Map({
    lifts,
    selectedLift,
    huts,
    selectedHut,
    mapUrl,
    statusColors,
    typeIcons,
    difficultyColors,
    onLiftSelect,
    onHutSelect,
    isDarkMode,
    zoomToLift,
    zoomToHut,
    onZoomComplete
}: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })

    const ORIGINAL_WIDTH = 1600
    const ORIGINAL_HEIGHT = 1200

    // Function to calculate bounds for a path or point
    const getBounds = useCallback((element: number[][] | [number, number]) => {
        if (!Array.isArray(element[0])) {
            // Single point (hut)
            const point = element as [number, number]
            return {
                minX: point[0] - 50,
                maxX: point[0] + 50,
                minY: point[1] - 50,
                maxY: point[1] + 50
            }
        }
        // Path (lift)
        const path = element as number[][]
        const xs = path.map(p => p[0])
        const ys = path.map(p => p[1])
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        }
    }, [])

    // Function to zoom to an element
    const zoomToElement = useCallback((element: number[][] | [number, number]) => {
        if (!containerRef.current) return

        const bounds = getBounds(element)
        const containerRect = containerRef.current.getBoundingClientRect()

        // Add different padding and zoom levels for huts vs lifts
        const isHut = !Array.isArray(element[0])
        const padding = isHut ? 20 : 50  // Smaller padding for huts
        const zoomMultiplier = isHut ? 2.5 : 0.8  // Higher zoom for huts

        const scaleX = containerRect.width / (bounds.maxX - bounds.minX + padding * 2)
        const scaleY = containerRect.height / (bounds.maxY - bounds.minY + padding * 2)
        const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY) * zoomMultiplier, MIN_ZOOM), MAX_ZOOM)

        const centerX = (bounds.minX + bounds.maxX) / 2
        const centerY = (bounds.minY + bounds.maxY) / 2

        setPan({
            x: (containerRect.width / 2) - (centerX * (containerRect.width / BASE_WIDTH) * newZoom),
            y: (containerRect.height / 2) - (centerY * (containerRect.height / BASE_HEIGHT) * newZoom)
        })
        setZoom(newZoom)

        setTimeout(() => {
            onZoomComplete?.()
        }, 300)
    }, [getBounds, onZoomComplete])

    // Effect to handle zooming to lifts or huts
    useEffect(() => {
        if (zoomToLift) {
            const lift = lifts.find(l => l.id === zoomToLift)
            if (lift?.path) {
                const path = typeof lift.path === 'string' ? JSON.parse(lift.path) : lift.path
                zoomToElement(path)
            }
        } else if (zoomToHut) {
            const hut = huts.find(h => h.id === zoomToHut)
            if (hut?.coordinates) {
                const coords = typeof hut.coordinates === 'string'
                    ? JSON.parse(hut.coordinates)
                    : hut.coordinates
                zoomToElement(coords)
            }
        }
    }, [zoomToLift, zoomToHut, lifts, huts, zoomToElement])

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

    // Reset function
    const handleReset = useCallback((e: React.MouseEvent) => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        e.stopPropagation()
    }, [])

    const renderHutMarkers = useCallback(() => {
        if (zoom < HUT_ZOOM_THRESHOLD) return null

        return huts.map((hut) => {
            const coords = typeof hut.coordinates === 'string'
                ? JSON.parse(hut.coordinates)
                : hut.coordinates

            const isSelected = selectedHut?.id === hut.id
            const scaleX = containerRef.current!.clientWidth / BASE_WIDTH
            const scaleY = containerRef.current!.clientHeight / BASE_HEIGHT

            // Calculate position considering zoom and pan
            const x = (coords[0] * scaleX * zoom) + pan.x
            const y = (coords[1] * scaleY * zoom) + pan.y

            return (
                <div
                    key={hut.id}
                    className="absolute"
                    style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                        // Add a scale transform to counter the parent's zoom
                        scale: `${1 / zoom}`
                    }}
                >
                </div>
            )
        })
    }, [huts, selectedHut, zoom, pan, isDarkMode])

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
                {renderHutMarkers()}
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
