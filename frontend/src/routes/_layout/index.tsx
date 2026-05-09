import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Plus, Swords, Trophy } from "lucide-react"
import { GamesApi, type GameSummary } from "@/lib/gameApi"
import useAuth from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard - Sensai" }] }),
})

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  quiz_ready: { label: "Quiz", color: "bg-blue-500/20 text-blue-400" },
  quiz_completed: { label: "Quiz ukończony", color: "bg-green-500/20 text-green-400" },
  training_ready: { label: "Trening", color: "bg-yellow-500/20 text-yellow-400" },
  training_completed: { label: "Trening ukończony", color: "bg-orange-500/20 text-orange-400" },
  completed: { label: "Ukończona", color: "bg-purple-500/20 text-purple-400" },
}

function gamePhaseRoute(game: GameSummary): string {
  const status = game.status ?? "quiz_ready"
  if (status === "completed") return `/games/${game.id}/summary`
  if (status.startsWith("training")) return `/games/${game.id}/training`
  if (status === "quiz_completed") return `/games/${game.id}/training`
  return `/games/${game.id}/quiz`
}

function GameCard({ game }: { game: GameSummary }) {
  const info = STATUS_LABELS[game.status ?? "quiz_ready"] ?? {
    label: game.status ?? "Nieznany",
    color: "bg-muted text-muted-foreground",
  }
  const progress = game.reading_progress ?? 0

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight line-clamp-2">{game.title}</CardTitle>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${info.color}`}>
            {info.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Postęp czytania</p>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
        {game.final_score != null && (
          <p className="text-sm text-muted-foreground">
            XP: <span className="font-semibold text-foreground">{game.final_score}</span>
          </p>
        )}
        <Link to={gamePhaseRoute(game) as any}>
          <Button size="sm" className="w-full mt-1">
            {game.status === "completed" ? "Zobacz wyniki" : "Wznów"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const { data: games, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: GamesApi.listGames,
  })

  const active = games?.filter((g) => g.status !== "completed") ?? []
  const finished = games?.filter((g) => g.status === "completed") ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Witaj, {user?.full_name ?? user?.email} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Twoje punkty:{" "}
            <span className="font-semibold text-foreground">{user?.total_points ?? 0} XP</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/leaderboard">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="h-4 w-4" /> Ranking
            </Button>
          </Link>
          <Link to="/games/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nowa gra
            </Button>
          </Link>
        </div>
      </div>

      {/* Active games */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" /> Aktywne sesje
        </h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Brak aktywnych sesji</p>
            <p className="text-sm mt-1">Utwórz nową grę, żeby zacząć naukę.</p>
            <Link to="/games/new">
              <Button className="mt-4 gap-2" size="sm">
                <Plus className="h-4 w-4" /> Nowa gra
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      {/* Finished games */}
      {finished.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Ukończone
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {finished.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
