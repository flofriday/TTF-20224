'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, RefreshCw, ChevronLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function CameraPage() {
    const router = useRouter()
    const [detectedImage, setDetectedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [isExiting, setIsExiting] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const resultTimeoutRef = useRef<NodeJS.Timeout>()

    const hideResults = () => {
        setIsExiting(true)
        setTimeout(() => {
            setDetectedImage(null)
            setCounts({})
            setIsExiting(false)
        }, 200)
    }

    const captureImage = async () => {
        if (!videoRef.current || isLoading) return

        if (resultTimeoutRef.current) {
            clearTimeout(resultTimeoutRef.current)
        }

        setIsLoading(true)
        setIsExiting(false)

        try {
            const canvas = document.createElement('canvas')
            const video = videoRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Could not get canvas context')

            ctx.drawImage(video, 0, 0)
            const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

            const response = await fetch('/api/detect-people', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    base64: base64Image,
                }),
            })

            if (!response.ok) {
                throw new Error(`Detection failed: ${response.statusText}`)
            }

            const data = await response.json()
            setDetectedImage(data.annotated_image)
            setCounts(data.counts)

            resultTimeoutRef.current = setTimeout(() => {
                hideResults()
            }, 3000)

        } catch (error) {
            console.error('Error detecting people:', error)
            hideResults()
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        startCamera()
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                streamRef.current = stream
            }
        } catch (err) {
            console.error('Error accessing camera:', err)
        }
    }

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden" onClick={captureImage}>
            {/* Camera View */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

            {/* Back Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    router.back()
                }}
                className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm 
                    hover:bg-black/70 transition-colors text-white"
            >
                <ChevronLeft className="w-6 h-6" />
                <span className="sr-only">Back</span>
            </button>

            {/* Viewfinder */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 relative flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                    {isLoading ? (
                        <RefreshCw className="h-8 w-8 text-white animate-spin" />
                    ) : (
                        <p className="text-white text-xl font-semibold opacity-70">
                            Tap to detect
                        </p>
                    )}
                </div>
            </div>

            {detectedImage && (
                <div className={`absolute bottom-0 inset-x-0 p-4 ${isExiting ? 'animate-slide-down' : 'animate-slide-up'}`}>
                    <Card className="bg-black/50 backdrop-blur-md border-white/20">
                        <div className="p-4 space-y-4">
                            <img
                                src={`data:image/jpeg;base64,${detectedImage}`}
                                alt="Detected"
                                className="w-full rounded-lg"
                            />
                            {Object.keys(counts).length > 0 && (
                                <div className="text-white">
                                    <h3 className="font-medium mb-2">Detected Objects:</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(counts).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="capitalize">{key}:</span>
                                                <span>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
