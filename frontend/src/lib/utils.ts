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
  lineWidth: number = 1,
  isDarkMode: boolean = false
) {
  if (!path || path.length < 2) return

  ctx.save()

  // Adjust color opacity based on dark mode
  const baseOpacity = isDarkMode ? 'cc' : '88' // More visible in dark mode
  const glowOpacity = isDarkMode ? '44' : '33'

  // Set line style
  ctx.strokeStyle = isSelected ? `#${color}` : `#${color}${baseOpacity}`
  ctx.lineWidth = isSelected ? lineWidth * 2.5 : lineWidth * 2.5
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
    ctx.strokeStyle = `#${color}${glowOpacity}`
    ctx.lineWidth = lineWidth * 4
    ctx.stroke()
  }

  ctx.restore()
}

export function drawContourLines(ctx: CanvasRenderingContext2D) {
  // This function can be empty if you're not using contour lines
  return
}
