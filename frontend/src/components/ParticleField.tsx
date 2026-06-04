import { useEffect, useRef } from 'react'

interface Node { x: number; y: number; vx: number; vy: number }

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const nodes: Node[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const n of nodes) {
        n.x = (n.x + n.vx + canvas.width) % canvas.width
        n.y = (n.y + n.vy + canvas.height) % canvas.height
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.strokeStyle = `rgba(196,168,130,${(1 - d / 110) * 0.06})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      ctx.fillStyle = 'rgba(245,240,232,0.25)'
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      animId = requestAnimationFrame(tick)
    }

    tick()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
}
