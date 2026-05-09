import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[420px_1fr]">
      {/* Left panel — matches dashboard dark sidebar aesthetic */}
      <div className="relative hidden overflow-hidden bg-[#0f1729] lg:flex lg:flex-col lg:justify-between">
        {/* Decorative arcs */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[340px] w-[340px] rounded-full border border-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full border border-white/[0.05]" />

        {/* Logo */}
        <div className="relative z-10 px-8 pt-10">
          <Logo variant="full" className="h-20 brightness-0 invert" asLink={false} />
        </div>

        {/* Tagline */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Ucz się szybciej.
            <br />
            <span className="text-white/50">Ucz się mądrzej.</span>
          </h2>
          <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-white/40">
            Twoja platforma do nauki z AI. Śledź postępy, zdobywaj doświadczenie i rozwijaj się każdego dnia.
          </p>
        </div>

        {/* Bottom ornament */}
        <div className="relative z-10 px-8 pb-8">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-white/30">System aktywny</span>
          </div>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo variant="icon" className="size-12" asLink={false} />
          </div>
          <div className="ml-auto">
            <Appearance />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
