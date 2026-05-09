import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Home, Loader2, Plus, Trophy } from "lucide-react"
import { GamesApi } from "@/lib/gameApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

  const { data: boss, isLoading: bossLoading } = useQuery({
    queryKey: ["bossResult", gameId],
    queryFn: () => GamesApi.getBossResult(gameId),
  })

  const { data: quizResults, isLoading: quizLoading } = useQuery({
    queryKey: ["quizResults", gameId],
    queryFn: () => GamesApi.getQuizResults(gameId),
  })

  if (gameLoading || bossLoading || quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const quizScore = quizResults
    ? Math.round((quizResults.correct_count / quizResults.total_count) * 100)
    : 0

  const stats = [
    {
      icon: "📚",
      label: "Quiz",
      value: `${quizResults?.correct_count ?? 0}/${quizResults?.total_count ?? 0}`,
      sub: `${quizScore}% poprawnych`,
    },
    {
      icon: "🎯",
      label: "Celność treningu",
      value: `${Math.round(boss?.accuracy_avg ?? 0)}%`,
      sub: "średnia ocena odpowiedzi",
    },
    {
      icon: "🔥",
      label: "Max Combo",
      value: `x${boss?.combo_count ?? 0}`,
      sub: "seria poprawnych odpowiedzi",
    },
    {
      icon: "⚡",
      label: "XP Zdobyte",
      value: `+${boss?.xp_gained ?? game?.final_score ?? 0}`,
      sub: "punkty doświadczenia",
    },
    {
      icon: "⚔️",
      label: "Obrażenia",
      value: `${boss?.player_damage_total ?? 0}/${boss?.boss_hp_start ?? 0}`,
      sub: "HP zabrano bossowi",
    },
    {
      icon: boss?.victory ? "🏆" : "💀",
      label: "Wynik walki",
      value: boss?.victory ? "Zwycięstwo!" : "Porażka",
      sub: boss?.victory ? "Boss pokonany" : "Boss przeżył",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3 pt-4">
        <div className="text-7xl">{boss?.victory ? "🏆" : "📖"}</div>
        <h1 className="text-3xl font-black tracking-tight">
          {boss?.victory ? "Doskonale!" : "Nieźle!"}
        </h1>
        <p className="text-lg font-semibold text-muted-foreground">
          {game?.title}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 space-y-1">
              <p className="text-2xl">{s.icon}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground/60">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz breakdown */}
      {quizResults && (
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Wyniki quizu
          </h2>
          <div className="space-y-2">
            {quizResults.questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 text-sm">
                <span
                  className={`shrink-0 mt-0.5 text-lg ${q.is_correct ? "text-green-500" : "text-red-500"}`}
                >
                  {q.is_correct ? "✓" : "✗"}
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Pytanie {i + 1}</p>
                  <p className="font-medium leading-snug">{q.question_text}</p>
                  {!q.is_correct && q.correct_answer && (
                    <p className="text-xs text-green-400 mt-0.5">
                      Prawidłowa: {q.correct_answer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center pb-8">
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
        <Link to="/leaderboard">
          <Button variant="outline" className="gap-2">
            <Trophy className="h-4 w-4" /> Ranking
          </Button>
        </Link>
        <Link to="/games/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nowa gra
          </Button>
        </Link>
      </div>
    </div>
  )
}
