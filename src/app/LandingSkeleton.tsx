export function LandingSkeleton() {
  return (
    <main className="min-h-screen bg-[#f3f6fb] px-5 md:px-10 py-6 md:py-8 animate-pulse">
      <div className="mx-auto w-full" style={{ maxWidth: 'var(--page-max-width, 1260px)' }}>
        <div className="h-16 rounded-2xl bg-white border border-slate-200" />
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-10">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-7">
            <div className="space-y-4">
              <div className="h-8 w-52 rounded-full bg-slate-200" />
              <div className="h-14 w-full max-w-3xl rounded-xl bg-slate-200" />
              <div className="h-14 w-full max-w-2xl rounded-xl bg-slate-200" />
              <div className="h-6 w-full max-w-2xl rounded-lg bg-slate-200" />
              <div className="h-6 w-full max-w-xl rounded-lg bg-slate-200" />
              <div className="pt-2 flex gap-3">
                <div className="h-12 w-36 rounded-xl bg-slate-200" />
                <div className="h-12 w-44 rounded-xl bg-slate-200" />
              </div>
            </div>
            <div className="rounded-3xl bg-slate-100 border border-slate-200 h-[340px]" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-card-${i}`} className="h-48 rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>

        <div className="mt-8 h-48 rounded-3xl bg-white border border-slate-200" />
      </div>
    </main>
  );
}
