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

export function drawContourLines(ctx: CanvasRenderingContext2D) {
  const canvas = ctx.canvas;
  const scaleX = canvas.width / 600;
  const scaleY = canvas.height / 600;
  
  // Center point
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Set contour line style
  ctx.strokeStyle = '#e2e8f0'; // slate-200
  ctx.lineWidth = 1;
  
  // Draw multiple contour paths of different sizes
  for (let scale = 1; scale <= 12; scale++) {
    const size = scale * 40;
    
    // Define the 5 control points for a rounded pentagon
    const points = [
      [centerX + size * scaleX, centerY],
      [centerX + size * 0.5 * scaleX, centerY - size * 0.8 * scaleY],
      [centerX - size * 0.5 * scaleX, centerY - size * 0.8 * scaleY],
      [centerX - size * scaleX, centerY],
      [centerX, centerY + size * scaleY],
    ];
    
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    
    // Draw curved lines between points
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      
      // Calculate control points for smooth curves
      const cp1x = current[0] + (next[0] - prev[0]) * 0.2;
      const cp1y = current[1] + (next[1] - prev[1]) * 0.2;
      const cp2x = next[0] - (next[0] - current[0]) * 0.2;
      const cp2y = next[1] - (next[1] - current[1]) * 0.2;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next[0], next[1]);
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Add a slight variation for a more natural look
    ctx.beginPath();
    ctx.moveTo(points[0][0] + Math.random() * 2 - 1, points[0][1] + Math.random() * 2 - 1);
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      
      const cp1x = current[0] + (next[0] - prev[0]) * 0.2 + (Math.random() * 2 - 1);
      const cp1y = current[1] + (next[1] - prev[1]) * 0.2 + (Math.random() * 2 - 1);
      const cp2x = next[0] - (next[0] - current[0]) * 0.2 + (Math.random() * 2 - 1);
      const cp2y = next[1] - (next[1] - current[1]) * 0.2 + (Math.random() * 2 - 1);
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, 
        next[0] + Math.random() * 2 - 1, 
        next[1] + Math.random() * 2 - 1
      );
    }
    
    ctx.closePath();
    ctx.stroke();
  }
}
