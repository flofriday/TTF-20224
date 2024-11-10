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
  lineWidth: number = 2,
  isDarkMode: boolean = false,
  zoom: number = 1
) {
  if (!path || path.length < 2) return

  ctx.save()

  // Adjust line width based on zoom level
  const zoomAdjustedWidth = lineWidth / Math.sqrt(zoom)
  console.log(zoomAdjustedWidth)
  // Set line style with zoom-adjusted widths
  ctx.strokeStyle = `#${color}`
  ctx.lineWidth = isSelected ? zoomAdjustedWidth * 2 : zoomAdjustedWidth * 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Draw the line
  ctx.beginPath()
  ctx.moveTo(path[0][0], path[0][1])
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0], path[i][1])
  }
  ctx.stroke()

  // If selected, add a smaller glow effect with solid color
  if (isSelected) {
    ctx.strokeStyle = `#${color}`
    ctx.lineWidth = zoomAdjustedWidth * 5
    ctx.stroke()
  }

  ctx.restore()
}

export function drawContourLines(ctx: CanvasRenderingContext2D) {
  // This function can be empty if you're not using contour lines
  return
}
