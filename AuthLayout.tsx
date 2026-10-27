import { Logo } from '../components/ui/controls'

/** Left panel draws the product's one idea: a message goes to exactly one person. */
function PrivateRoute() {
  return (
    <svg viewBox="0 0 360 220" className="w-full max-w-md" role="img" aria-label="Alice sends a message to Bob. Charlie receives nothing.">
      <g fontFamily="inherit" fontSize="13" fontWeight="700">
        <circle cx="50" cy="60" r="26" fill="#ccfbf1" /><text x="50" y="65" textAnchor="middle" fill="#0f766e">A</text>
        <circle cx="310" cy="60" r="26" fill="#ccfbf1" /><text x="310" y="65" textAnchor="middle" fill="#0f766e">B</text>
        <circle cx="180" cy="176" r="26" fill="none" stroke="#5eead4" strokeOpacity=".4" strokeDasharray="4 4" /><text x="180" y="181" textAnchor="middle" fill="#5eead4" fillOpacity=".55">C</text>
      </g>
      <path d="M80 60H280" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" />
      <path d="M270 52l12 8-12 8" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="128" y="38" width="104" height="24" rx="12" fill="#f0fdfa" /><text x="180" y="54" textAnchor="middle" fontSize="12" fontWeight="600" fill="#134e4a">Hello Bob!</text>
      <path d="M70 92L150 160" stroke="#5eead4" strokeOpacity=".3" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
      <path d="M290 92L210 160" stroke="#5eead4" strokeOpacity=".3" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
      <path d="M170 132l20 20m0-20l-20 20" stroke="#5eead4" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" transform="translate(0 -14)" />
    </svg>
  )
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" style={{ minHeight: '100dvh' }}>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0b3b38] p-12 text-teal-50 lg:flex">
        <div className="flex items-center gap-2.5 text-lg font-extrabold"><Logo size={32} /> Thread</div>
        <div>
          <PrivateRoute />
          <h2 className="mt-8 max-w-sm text-4xl font-extrabold leading-tight tracking-tight">Say it to one person.</h2>
          <p className="mt-3 max-w-sm text-teal-100/80">Every message is routed to its recipient only. Nobody else connected sees it, not even that it was sent.</p>
        </div>
        <p className="text-sm text-teal-100/60">End-to-end routing on your own server.</p>
      </aside>
      <main className="flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-md animate-fade rounded-3xl border border-line bg-surface p-7 shadow-sm sm:p-9">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden"><Logo /><span className="text-lg font-extrabold">Thread</span></div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  )
}
