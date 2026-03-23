export default function MeshBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)', top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)', bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-4s' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-8s' }} />
    </div>
  )
}
