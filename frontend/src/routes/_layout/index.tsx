import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  BookOpen,
  Plus,
  Bell,
  User as UserIcon,
  Sun,
  Moon,
} from "lucide-react"
import { toast } from "sonner"
import { GamesApi, type GameSummary } from "@/lib/gameApi"
import useAuth from "@/hooks/useAuth"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function gameRoute(g: GameSummary) {
  if (g.status === "quiz_completed") return { to: "/games/$gameId/training" as const, params: { gameId: g.id } }
  if (g.status === "training_completed") return { to: "/games/$gameId/boss" as const, params: { gameId: g.id } }
  return { to: "/games/$gameId/quiz" as const, params: { gameId: g.id } }
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard - Sensai" }] }),
})

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()

  const { data: games, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: GamesApi.listGames,
  })

  const active = games?.filter((g) => g.status !== "completed") ?? []

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")

  return (
    <div className="mx-auto max-w-[1180px] space-y-10 pb-12">
      <div className="flex items-center justify-end gap-3">
        <div className="rounded-md bg-card px-4 py-2 text-sm font-semibold shadow-sm border border-border">
          {user ? user.total_points.toLocaleString("pl-PL") : "—"} XP
        </div>
        <button
          onClick={toggleTheme}
          className="size-9 rounded-md border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
          title={resolvedTheme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => toast.info("Brak nowych powiadomień.")}
          className="size-9 rounded-md border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate({ to: "/settings" })}
          className="size-9 rounded-md border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
        >
          <UserIcon className="h-4 w-4" />
        </button>
      </div>

      <section className="rounded-xl border border-border bg-card shadow-[0_18px_40px_rgba(15,12,24,0.08)] relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 size-72 rounded-xl border border-border/60" />
        <div className="relative p-10 space-y-6 max-w-3xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Witaj z powrotem.</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Twój umysł jest jak czysta kartka, gotowy na nową wiedzę.
              Kontynuuj swoją podróż lub rozpocznij nową ścieżkę.
            </p>
          </div>

          <div className="flex items-center gap-10 text-sm">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Obecna ranga</p>
              <p className="text-lg font-semibold">Mistrz</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Całkowite XP</p>
              <p className="text-lg font-semibold">{user ? user.total_points.toLocaleString("pl-PL") : "—"}</p>
            </div>
          </div>

          <Link to="/games/new">
            <Button className="rounded-lg bg-primary px-6 py-5 text-sm font-semibold shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Rozpocznij nową przygodę
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Twoje aktywne sesje</h2>
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
            <p className="text-sm text-muted-foreground">Brak aktywnych sesji.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {active.slice(0, 2).map((g) => (
              <Link
                key={g.id}
                {...gameRoute(g)}
                className="rounded-lg border border-border bg-card shadow-[0_12px_30px_rgba(15,12,24,0.06)] p-6 block hover:border-primary/50 hover:shadow-[0_12px_30px_rgba(15,12,24,0.12)] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="size-9 rounded-md bg-muted flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] uppercase tracking-widest bg-muted px-3 py-1 rounded-md text-muted-foreground">
                    {g.reading_progress >= 100 ? "Teaching" : "Learning"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold leading-snug">{g.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  Kontynuuj swoją przygodę edukacyjną.
                </p>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Postęp</span>
                    <span>{Math.min(g.reading_progress ?? 0, 100)}%</span>
                  </div>
                  <div className="h-2 rounded-md bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-md bg-primary/80"
                      style={{ width: `${Math.min(g.reading_progress ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
