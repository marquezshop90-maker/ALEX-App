export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-alex-gradient flex items-center justify-center shadow-2xl"
             style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
          <span className="text-3xl font-black text-white">A</span>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-alex-amber/20 blur-lg animate-pulse-slow" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-black text-gradient-amber">ALEX</h1>
        <p className="text-gray-500 text-sm mt-1">Achieve the EXam</p>
      </div>
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-alex-amber animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-alex-amber animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-alex-amber animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
