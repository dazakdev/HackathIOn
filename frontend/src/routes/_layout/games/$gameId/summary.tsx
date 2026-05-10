import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
   Award,
   BookOpen,
   Clock3,
   Home,
   Info,
   Loader2,
   Moon,
   Plus,
   Sun,
   Target,
} from "lucide-react"
import { Logo } from "@/components/Common/Logo"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { GamesApi } from "@/lib/gameApi"

export const Route = createFileRoute("/_layout/games/$gameId/summary")({
   component: SummaryPage,
   head: () => ({ meta: [{ title: "Podsumowanie - Sensai" }] }),
})

function SummaryPage() {
   const { gameId } = Route.useParams()
   const navigate = useNavigate()
   const { resolvedTheme, setTheme } = useTheme()

   const toggleTheme = () => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
   }

   const { data: game, isLoading: gameLoading } = useQuery({
      queryKey: ["game", gameId],
      queryFn: () => GamesApi.getGame(gameId),
   })

   const { data: bossResult, isLoading: bossLoading } = useQuery({
      queryKey: ["bossResult", gameId],
      queryFn: () => GamesApi.getBossResult(gameId),
   })

   const { data: training, isLoading: trainingLoading } = useQuery({
      queryKey: ["training", gameId],
      queryFn: () => GamesApi.getTraining(gameId),
   })

   if (gameLoading || bossLoading || trainingLoading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium text-lg">
               Podsumowuję Twoje osiągnięcia…
            </span>
         </div>
      )
   }

   const isVictory = bossResult?.victory ?? false
   const accuracy = bossResult ? bossResult.accuracy_avg : 0
   const xp = bossResult?.xp_gained ?? 0
   // Actually player doesn't have HP in current model, but let's show student's state

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
                  <img
                     src={isVictory ? "/ninja/backflip.gif" : "/ninja/dead.png"}
                     alt="Uczeń"
                     className="w-56 drop-shadow-[0_0_30px_var(--color-primary)]"
                  />
               </div>

               <div className="text-center space-y-2">
                  <h3 className="text-foreground font-bold">
                     {isVictory ? "Wielkie zwycięstwo!" : "Cenna lekcja..."}
                  </h3>
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
            <header className="h-24 border-b border-border flex items-center px-14 py-4 justify-between bg-background/80 backdrop-blur-md z-10 sticky top-0 shadow-sm">
               <div className="flex items-center gap-5">
                  <div
                     className={`size-12 rounded-xl flex items-center justify-center ${isVictory ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                  >
                     <Award className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                     <h2 className="font-black text-xl text-foreground leading-tight tracking-tight">
                        {game?.title ?? "Podsumowanie przygody"}
                     </h2>
                     <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-70">
                        Faza 4: Wynik końcowy
                     </span>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button
                     type="button"
                     onClick={toggleTheme}
                     className="size-10 rounded-xl border border-border bg-card flex items-center justify-center transition-all hover:bg-muted shadow-sm"
                     title="Zmień motyw"
                  >
                     {resolvedTheme === "dark" ? (
                        <Sun className="h-4 w-4 text-yellow-400" />
                     ) : (
                        <Moon className="h-4 w-4 text-primary" />
                     )}
                  </button>

               </div>
            </header>

            <div className="p-10 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="text-center">
                  <h1 className="text-4xl font-extrabold text-foreground mb-2 uppercase tracking-tighter">
                     {isVictory ? "Zwycięstwo" : "Porażka"}
                  </h1>
                  <p className="text-muted-foreground">
                     Oto szczegółowy raport z bitwy
                  </p>
               </div>

               <div className="w-full max-w-sm flex justify-center">
                  <img
                     src={isVictory ? "/ninja/win.gif" : "/ninja/lost.gif"}
                     alt={isVictory ? "Zwycięstwo" : "Porażka"}
                     className="w-full h-auto drop-shadow-2xl rounded-2xl"
                  />
               </div>

               {/* Stats Grid */}
               <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl hover:translate-y-[-4px] transition-all">
                     <div className="size-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Target className="h-6 w-6" />
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                           Celność
                        </p>
                        <p className="text-2xl font-black text-foreground">
                           {accuracy}%
                        </p>
                     </div>
                  </div>

                  <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl hover:translate-y-[-4px] transition-all">
                     <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Award className="h-6 w-6" />
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                           Doświadczenie
                        </p>
                        <p className="text-2xl font-black text-foreground">+{xp} XP</p>
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

               {/* Ideal Answers Section */}
               {training?.questions && training.questions.length > 0 && (
                  <div className="w-full max-w-3xl space-y-6 mt-4">
                     <div className="flex items-center gap-3 px-2">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                           <BookOpen className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">
                           Wzorcowe wyjaśnienia
                        </h3>
                     </div>

                     <div className="grid gap-4">
                        {training.questions.map((q, idx) => (
                           <div
                              key={q.id}
                              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                           >
                              <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                    Pytanie {idx + 1}
                                 </span>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                       Twoja ocena:
                                    </span>
                                    <span
                                       className={`text-xs font-black ${q.score && q.score >= 80 ? "text-green-500" : q.score && q.score >= 50 ? "text-yellow-500" : "text-red-500"}`}
                                    >
                                       {q.score}/100
                                    </span>
                                 </div>
                              </div>
                              <div className="p-6 space-y-4">
                                 <p className="text-sm font-semibold text-foreground leading-relaxed">
                                    {q.question_text}
                                 </p>
                                 <div className="space-y-3">
                                    <div className="rounded-xl bg-muted/20 p-4 border border-border/50">
                                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 opacity-70">
                                          Twoja odpowiedź:
                                       </span>
                                       <p className="text-sm text-foreground/80 leading-relaxed">
                                          {q.user_answer || "Brak odpowiedzi"}
                                       </p>
                                    </div>
                                    {q.ideal_answer && (
                                       <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                                          <div className="flex items-center gap-2 mb-2">
                                             <Info className="h-3.5 w-3.5 text-primary opacity-70" />
                                             <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                                Wzorcowe wyjaśnienie:
                                             </span>
                                          </div>
                                          <p className="text-sm text-foreground/90 font-medium leading-relaxed italic">
                                             "{q.ideal_answer}"
                                          </p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </main>
      </div>
   )
}
