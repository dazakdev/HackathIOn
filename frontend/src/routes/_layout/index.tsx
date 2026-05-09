import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  BookOpen,
  Plus,
  Swords,
  Trophy,
  Activity,
  Flame,
  ArrowRight,
} from "lucide-react"
import { GamesApi, type GameSummary } from "@/lib/gameApi"
import useAuth from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard - Sensai" }] }),
})

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  quiz_ready: { label: "Quiz", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
  quiz_completed: { label: "Quiz ukończony", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
  training_ready: { label: "Trening", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
  training_completed: { label: "Trening ukończony", color: "bg-orange-500/10 text-orange-500 border border-orange-500/20" },
  completed: { label: "Ukończona", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
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
    color: "bg-muted text-muted-foreground border-border",
  }
  const progress = game.reading_progress ?? 0

  return (
    <Card className="group hover:border-primary/50 transition-colors flex flex-col justify-between h-full bg-card shadow-sm hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.color}`}>
            {info.label}
          </span>
          {game.final_score != null && (
            <span className="flex items-center text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              <Trophy className="h-3 w-3 mr-1" />
              {game.final_score} XP
            </span>
          )}
        </div>
        <CardTitle className="text-lg leading-tight line-clamp-2">{game.title}</CardTitle>
        <CardDescription className="text-xs line-clamp-2 mt-1">
          Kliknij, aby kontynuować przygodę na etapie {info.label}.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        {progress > 0 && game.status !== "completed" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Postęp</span>
              <span>{Math.min(progress, 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
        <Link to={gamePhaseRoute(game) as any} className="block mt-2">
          <Button size="sm" className="w-full gap-2 group-hover:bg-primary/90 transition-colors">
            {game.status === "completed" ? "Zobacz wyniki" : "Kontynuuj"}
            <ArrowRight className="h-4 w-4" />
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
    <div className="space-y-10 pb-10">
      {/* Top Bar Stats */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            Witaj, {user?.full_name ?? user?.email?.split('@')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Gotowy na kolejne wyzwanie? Zobaczmy co dzisiaj osiągniesz.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-muted/50 border rounded-2xl px-4 py-2">
            <div className="flex items-center justify-center bg-yellow-500/20 text-yellow-500 rounded-full h-10 w-10">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Twoje XP</p>
              <p className="font-bold text-lg leading-none">{user?.total_points ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 border rounded-2xl px-4 py-2">
            <div className="flex items-center justify-center bg-orange-500/20 text-orange-500 rounded-full h-10 w-10">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ranga</p>
              <p className="font-bold text-lg leading-none">{user?.total_points && user.total_points > 1000 ? "Mistrz" : "Uczeń"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/10 shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Swords className="w-64 h-64 -rotate-12" />
        </div>
        <div className="relative p-8 md:p-12 md:w-2/3 space-y-4">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
            Nowa Przygoda
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Rozpocznij nowy cykl nauki
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
            Wklej dowolny tekst źródłowy, a my wygenerujemy dla Ciebie interaktywny quiz, sesję treningową i ekscytującą walkę z bossem wiedzy!
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link to="/games/new">
              <Button size="lg" className="h-12 px-8 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Plus className="mr-2 h-5 w-5" /> Rozpocznij nową przygodę
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-bold bg-background/50 backdrop-blur-sm">
                <Trophy className="mr-2 h-5 w-5" /> Zobacz ranking
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary - Placeholder */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Aktywność z tego tygodnia</p>
              <p className="text-2xl font-bold">Wysoka</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Przeczytane teksty</p>
              <p className="text-2xl font-bold">{finished.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Swords className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pokonani bossowie</p>
              <p className="text-2xl font-bold">{finished.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active games */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" /> Aktywne sesje
          </h2>
        </div>
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-muted bg-muted/10 p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold mb-1">Brak aktywnych sesji</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Nie masz obecnie żadnych otwartych przygód edukacyjnych. Rozpocznij nową, aby zdobywać wiedzę i XP.
            </p>
            <Link to="/games/new">
              <Button size="lg" className="font-bold shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Nowa sesja
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      {/* Finished games */}
      {finished.length > 0 && (
        <section className="pt-4 border-t">
          <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2 opacity-80">
            <Trophy className="h-6 w-6 text-yellow-500" /> Ukończone
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-90">
            {finished.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
