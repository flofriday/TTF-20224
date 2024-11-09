import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function drawLiftLine(
  ctx: CanvasRenderingContext2D,
  path: [number, number][],
  color: string = '#000000',
  lineWidth: number = 2
) {
  if (!path || path.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Move to first point
  ctx.moveTo(path[0][0], path[0][1]);

  // Draw lines to subsequent points
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0], path[i][1]);
  }

  ctx.stroke();
}
