import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function drawLiftLine(
  ctx: CanvasRenderingContext2D,
  path: number[][],
  color: string,
  isSelected: boolean = false,
  lineWidth: number = 1
) {
  if (!path || path.length < 2) return

  ctx.save()

  // Set line style
  ctx.strokeStyle = isSelected ? `#${color}` : `#${color}88` // Add transparency for non-selected
  ctx.lineWidth = isSelected ? lineWidth * 1.5 : lineWidth // Reduced from 2x to 1.5x for selected
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Begin the path
  ctx.beginPath()
  ctx.moveTo(path[0][0], path[0][1])

  // Draw the line segments
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0], path[i][1])
  }

  // Stroke the path
  ctx.stroke()

  // If selected, add a glow effect
  if (isSelected) {
    ctx.strokeStyle = `#${color}33` // Very transparent
    ctx.lineWidth = lineWidth * 4 // Reduced from 6x to 4x
    ctx.stroke()
  }

  ctx.restore()
}

export function drawContourLines(ctx: CanvasRenderingContext2D) {
  // This function can be empty if you're not using contour lines
  return
}
