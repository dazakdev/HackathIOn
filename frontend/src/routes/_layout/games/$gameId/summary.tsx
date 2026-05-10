import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Home, Loader2, Plus, Swords, Award, Target, Zap, Clock3, User, Bot } from "lucide-react"
import { GamesApi } from "@/lib/gameApi"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Common/Logo"
import { useTheme } from "@/components/theme-provider"

export const Route = createFileRoute("/_layout/games/$gameId/summary")({
  component: SummaryPage,
  head: () => ({ meta: [{ title: "Podsumowanie - Sensai" }] }),
})

function SummaryPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => GamesApi.getGame(gameId),
  })

  const { data: bossResult, isLoading: bossLoading } = useQuery({
    queryKey: ["bossResult", gameId],
    queryFn: () => GamesApi.getBossResult(gameId),
  })

  if (gameLoading || bossLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium text-lg">Podsumowuję Twoje osiągnięcia…</span>
      </div>
    )
  }

  const isVictory = bossResult?.victory ?? false
  const accuracy = bossResult ? Math.round(bossResult.accuracy_avg * 100) : 0
  const xp = bossResult?.xp_gained ?? 0
  // Actually player doesn't have HP in current model, but let's show student's state
  const bossHPPercent = bossResult ? Math.max(0, Math.round((bossResult.boss_hp_end / bossResult.boss_hp_start) * 100)) : 0

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
            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl px-6 py-3 text-sm font-bold shadow-2xl animate-bounce ${isVictory ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {isVictory ? "UDAŁO SIĘ!" : "NASTĘPNYM RAZEM!"}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] ${isVictory ? "border-t-green-500" : "border-t-red-500"}`} />
            </div>
            <img src="/assets/images/student.gif" alt="Uczeń" className="w-56 drop-shadow-[0_0_30px_var(--color-primary)]" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-foreground font-bold">{isVictory ? "Wielkie zwycięstwo!" : "Cenna lekcja..."}</h3>
            <p className="text-muted-foreground text-xs px-4">
              {isVictory 
                ? "Twój uczeń pokonał przeciwnika dzięki Twoim jasnym wyjaśnieniom!" 
                : "Tym razem przeciwnik okazał się silniejszy. Musimy potrenować jeszcze trochę."}
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => navigate({ to: "/" })}
        >
          <Home className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-background relative overflow-y-auto">
        <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
        
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center px-10 justify-between bg-background/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
             <div className={`size-10 rounded-lg flex items-center justify-center ${isVictory ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                <Award className="h-5 w-5" />
             </div>
             <div className="flex flex-col">
                <h2 className="font-bold text-foreground leading-tight">{game?.title ?? "Podsumowanie przygody"}</h2>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Faza 4: Wynik końcowy</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-card border border-border">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground font-mono tracking-wider">12:45</span>
          </div>
        </header>

        <div className="p-10 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-foreground mb-2 uppercase tracking-tighter">
              {isVictory ? "Zwycięstwo" : "Porażka"}
            </h1>
            <p className="text-muted-foreground">Oto szczegółowy raport z bitwy</p>
          </div>

          {/* VS Card */}
          <div className="w-full max-w-3xl rounded-2xl bg-card border border-border p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
             
             <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-12 relative z-10">
                <div className="space-y-4 text-center">
                   <div className="mx-auto size-20 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                   </div>
                   <div>
                      <p className="font-bold text-foreground">Twój Uczeń</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Dobra forma</p>
                   </div>
                   <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: "100%" }} />
                      </div>
                      <p className="text-[10px] font-bold text-green-500 uppercase">HP: 100%</p>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                   <div className="size-14 rounded-full bg-background border border-border flex items-center justify-center shadow-xl">
                      <Swords className="h-6 w-6 text-muted-foreground" />
                   </div>
                   <div className="h-20 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
                </div>

                <div className="space-y-4 text-center">
                   <div className="mx-auto size-20 rounded-xl bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
                      <Bot className="h-10 w-10 text-red-500" />
                   </div>
                   <div>
                      <p className="font-bold text-foreground">Kwantowy Kolos</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Przeciwnik</p>
                   </div>
                   <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000" style={{ width: `${bossHPPercent}%` }} />
                      </div>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">HP: {bossHPPercent}%</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl hover:translate-y-[-4px] transition-all">
                <div className="size-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                   <Target className="h-6 w-6" />
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Celność</p>
                   <p className="text-2xl font-black text-foreground">{accuracy}%</p>
                </div>
             </div>

             <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl hover:translate-y-[-4px] transition-all">
                <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                   <Award className="h-6 w-6" />
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Doświadczenie</p>
                   <p className="text-2xl font-black text-foreground">+{xp} XP</p>
                </div>
             </div>

             <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl hover:translate-y-[-4px] transition-all">
                <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                   <Zap className="h-6 w-6" />
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Największe Combo</p>
                   <p className="text-2xl font-black text-foreground">{bossResult?.combo_count ?? 0}x</p>
                </div>
             </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
             <Button 
                variant="default" 
                size="lg" 
                className="flex-1 h-14 font-bold text-lg gap-3 shadow-xl"
                onClick={() => navigate({ to: "/games/new" })}
             >
                <Plus className="h-5 w-5" /> Nowa gra
             </Button>
             <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 h-14 font-bold text-lg gap-3 shadow-xl"
                onClick={() => navigate({ to: "/" })}
             >
                <Home className="h-5 w-5" /> Pulpit
             </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
