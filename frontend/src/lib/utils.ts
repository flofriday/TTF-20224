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

  const canvas = ctx.canvas;
  // Calculate scale factors based on original 600x600 coordinate system
  const scaleX = canvas.width / 600;
  const scaleY = canvas.height / 600;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Scale coordinates
  ctx.moveTo(path[0][0] * scaleX, path[0][1] * scaleY);

  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0] * scaleX, path[i][1] * scaleY);
  }

  ctx.stroke();
}
