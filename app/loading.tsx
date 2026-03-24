export default function Loading() {
  const heights = [320, 420, 280, 380, 460, 310, 350, 400, 290, 370, 440, 300]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Desktop: 4 cols */}
      <div className="hidden md:flex gap-3">
        {[0, 1, 2, 3].map(ci => (
          <div key={ci} className="flex-1 flex flex-col gap-3">
            {heights.slice(ci * 3, ci * 3 + 3).map((h, i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-100 animate-pulse"
                style={{ height: h }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Mobile: 2 cols */}
      <div className="flex md:hidden gap-3">
        {[0, 1].map(ci => (
          <div key={ci} className="flex-1 flex flex-col gap-3">
            {heights.slice(ci * 4, ci * 4 + 4).map((h, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
