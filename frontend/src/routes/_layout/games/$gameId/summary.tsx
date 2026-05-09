import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Home, Loader2, Plus, Swords } from "lucide-react"
import { GamesApi } from "@/lib/gameApi"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/games/$gameId/summary")({
  component: SummaryPage,
  head: () => ({ meta: [{ title: "Podsumowanie - Sensai" }] }),
})

function SummaryPage() {
  const { gameId } = Route.useParams()

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => GamesApi.getGame(gameId),
  })

  const { data: quizResults, isLoading: quizLoading } = useQuery({
    queryKey: ["quizResults", gameId],
    queryFn: () => GamesApi.getQuizResults(gameId),
  })

  if (gameLoading || quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const quizScore = quizResults
    ? Math.round((quizResults.correct_count / quizResults.total_count) * 100)
    : 0

  return (
    <div className="mx-auto max-w-[1200px] h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-white/10 bg-[#2f2f2f] shadow-[0_30px_80px_rgba(0,0,0,0.4)] flex flex-col">
      <div className="h-12 bg-[#3b3b3b] flex items-center px-6 text-xs text-white/80">
        <div className="font-semibold">{game?.title ?? "Wprowadzenie do Stoicyzmu"}</div>
        <div className="flex-1" />
        <div className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold">12,450 XP</div>
      </div>

      <div className="flex-1 grid md:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 flex flex-col items-center justify-center gap-6 p-6">
          <div className="rounded-lg bg-white text-black px-6 py-3 text-sm font-semibold shadow-lg text-center">
            Poszło całkie nieźle!
          </div>
          <img src="/assets/images/student.gif" alt="Uczeń" className="w-40" />
        </aside>

        <div className="flex flex-col items-center justify-center px-10 py-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold uppercase tracking-widest">Wynik walki ucznia</h1>
            <p className="text-xs text-white/60">Uczeń ledwo uszedł z życiem</p>
          </div>

          <div className="w-full max-w-2xl rounded-lg bg-black/30 border border-white/10 p-8 text-center">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div className="space-y-3">
                <div className="mx-auto size-16 rounded-md border-2 border-white/60" />
                <p className="text-sm font-semibold">Twój Uczeń</p>
                <div className="h-2 rounded-md bg-white/10 overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "85%" }} />
                </div>
                <p className="text-[11px] text-white/60">HP: 850 / 1000</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-lg font-semibold">VS</div>
                <Swords className="h-4 w-4 text-white/60" />
              </div>
              <div className="space-y-3">
                <div className="mx-auto size-16 rounded-md border-2 border-white/60" />
                <p className="text-sm font-semibold">Kwantowy Kolos</p>
                <div className="h-2 rounded-md bg-white/10 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: "15%" }} />
                </div>
                <p className="text-[11px] text-white/60">HP: 150 / 2000</p>
              </div>
            </div>
          </div>

          <div className="mt-6 w-full max-w-2xl grid md:grid-cols-[1.3fr_0.7fr] gap-6">
            <div className="rounded-lg bg-black/30 border border-white/10 p-6 text-center">
              <p className="text-[11px] uppercase tracking-widest text-white/60">Punkty przygody</p>
              <p className="text-2xl font-semibold mt-2">1932 / 2000 XP</p>
              <p className="text-xs text-white/60 mt-2">
                Doskonała robota! Twoja wiedza zdominowała przeciwnika w finałowym starciu.
              </p>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 p-6 text-center">
              <p className="text-[11px] uppercase tracking-widest text-white/60">Celność</p>
              <div className="mt-4 size-20 rounded-md border-4 border-white/20 flex items-center justify-center mx-auto">
                <span className="text-lg font-semibold">{quizScore}%</span>
              </div>
              <p className="text-xs text-white/60 mt-3">22/25 Poprawnych</p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/">
              <Button className="rounded-xl bg-white text-black gap-2">
                <Home className="h-4 w-4" /> Powrót do pulpitu
              </Button>
            </Link>
            <Link to="/games/new">
              <Button className="rounded-xl bg-white text-black gap-2">
                <Plus className="h-4 w-4" /> Powtórz walkę
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
