import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function drawLiftLine(
  ctx: CanvasRenderingContext2D,
  path: number[][],
  color: string,
  lineWidth: number,
  useRawCoordinates: boolean = false
) {
  if (!path || path.length < 2) return

  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth

  // Start from the first point
  ctx.moveTo(path[0][0], path[0][1])

  // Draw lines to each subsequent point
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0], path[i][1])
  }

  ctx.stroke()
}

export function drawContourLines(ctx: CanvasRenderingContext2D) {
  // This function can be empty if you're not using contour lines
  return
}
