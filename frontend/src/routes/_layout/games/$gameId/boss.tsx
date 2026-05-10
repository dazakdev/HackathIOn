import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, useRef } from "react"
import { GamesApi } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Loader2, Swords, Clock3, Zap, User, Bot } from "lucide-react"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/games/$gameId/boss")({
  component: BossPage,
  head: () => ({ meta: [{ title: "Walka z Bossem - Sensai" }] }),
})

type BattlePhase = "loading" | "error"

function BossPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const setPhase = useGameStore((s) => s.setPhase)
  const queryClient = useQueryClient()
  const [phase, setPhaseState] = useState<BattlePhase>("loading")
  const startTime = useRef<number>(Date.now())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { mutate: startBattle, isPending, isSuccess, isError } = useMutation({
    mutationFn: () => GamesApi.startBossBattle(gameId),
    onSuccess: () => {
      const elapsed = Date.now() - startTime.current
      const minDelay = 5000

      const navigateToSummary = () => {
        setPhase("summary")
        queryClient.invalidateQueries({ queryKey: ["games"] })
        navigate({ to: "/games/$gameId/summary", params: { gameId } })
      }

      if (elapsed < minDelay) {
        setTimeout(navigateToSummary, minDelay - elapsed)
      } else {
        navigateToSummary()
      }
    },
    onError: (err: any) => {
      setPhaseState("error")
      setErrorMsg(err?.response?.data?.detail ?? err?.message ?? "Nieznany błąd")
    },
  })

  const hasStarted = useRef(false)
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      startBattle()
    }
  }, [startBattle])

  if (phase === "error") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
        <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
          <Zap className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Nie udało się uruchomić walki.</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-center">
          {errorMsg}
        </p>
        <Button
          variant="outline"
          className="mt-8 border-border"
          onClick={() => navigate({ to: "/" })}
        >
          Powrót do pulpitu
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[340px] border-r border-border flex flex-col items-center py-10 px-8 bg-card/30">
        <div className="mb-12 flex flex-col items-center gap-2">
          <Logo variant="icon" className="h-16 w-auto" asLink={true} />
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">
            Przygotuj ucznia do walki
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-10">
          <div className="relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-red-500 text-white px-6 py-3 text-sm font-bold shadow-2xl animate-pulse">
              CZAS NA WALKĘ!
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-500" />
            </div>
            <img src="/assets/images/student.gif" alt="Uczeń" className="w-56 drop-shadow-[0_0_30px_var(--color-primary)]" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-foreground font-bold italic">"Muszę aktywować więcej neuronów!"</h3>
            <p className="text-muted-foreground text-xs px-4">Twój uczeń właśnie staje oko w oko z potężnym przeciwnikiem.</p>
          </div>
        </div>

        <div className="w-full p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Trwa symulacja...</span>
        </div>
      </aside>

      {/* Main battle area */}
      <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-[0.03] pointer-events-none" />

        {/* Header */}
        <header className="h-20 border-b border-border flex items-center px-10 justify-between bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Swords className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-foreground leading-tight">Ostateczne starcie</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Faza 3: Walka z Bossem</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-card border border-border">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground font-mono tracking-wider">00:05</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="w-full max-w-4xl space-y-12 relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-md bg-red-500/80 px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest">HARD MODE</span>
                <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Kwantowy Kolos</h1>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status przeciwnika</p>
                <p className="text-xl font-black text-red-500 animate-pulse">AGRESYWNY</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-1000" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
                <img
                  src="/assets/images/battle.webp"
                  alt="Battle"
                  className="w-full aspect-video object-cover transition-transform duration-[10s] scale-110 hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-end p-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-3 flex-1 bg-white/10 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-red-500 animate-[shimmer_2s_infinite] shadow-[0_0_20px_rgba(239,68,68,0.8)]" style={{ width: "100%" }} />
                    </div>
                    <span className="text-xs font-black text-white">HP: 100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-1 rounded-full bg-primary/20 overflow-hidden"
                    >
                      <div
                        className="h-full bg-primary animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Przetwarzanie strategii walki...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
