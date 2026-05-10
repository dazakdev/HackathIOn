import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { GamesApi } from "@/lib/gameApi"

export const Route = createFileRoute("/_layout/leaderboard")({
  component: LeaderboardPage,
  head: () => ({ meta: [{ title: "Ranking - Sensai" }] }),
})

const MEDALS = ["1st", "2nd", "3rd"]

function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: GamesApi.getLeaderboard,
    refetchInterval: 30_000,
  })

  const entries = data ?? []
  const topThree = entries.slice(0, 3)
  const rest = entries.slice(3, 10)

  const renderPodium = () => (
    <div className="flex items-end justify-center gap-6 py-6">
      {[1, 0, 2].map((idx) => {
        const entry = topThree[idx]
        return (
          <div key={idx} className="flex flex-col items-center gap-3">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">
              {MEDALS[idx]}
            </div>
            <div className="size-20 rounded-lg bg-muted border border-border flex items-center justify-center">
              <div className="size-12 rounded-md border-2 border-border bg-card" />
            </div>
            <p className="text-xs font-semibold">
              {entry?.full_name ??
                entry?.email?.split("@")[0] ??
                "Tomasz Tomczyk"}
            </p>
          </div>
        )
      })}
    </div>
  )

  const renderRows = () => (
    <div className="space-y-3">
      {rest.length > 0 ? (
        rest.map((entry, idx) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-md bg-muted/60 px-4 py-2 text-sm"
          >
            <span className="text-xs text-muted-foreground">
              {idx + 4}. {entry.full_name ?? entry.email.split("@")[0]}
            </span>
            <span className="rounded-md bg-card px-3 py-1 text-[11px] font-semibold">
              {entry.total_points.toLocaleString("pl-PL")} XP
            </span>
          </div>
        ))
      ) : (
        <div className="text-center text-sm text-muted-foreground py-6">
          Brak wyników
        </div>
      )}
      <div className="text-center text-muted-foreground">…</div>
      <div className="flex items-center justify-between rounded-md bg-muted/60 px-4 py-2 text-sm">
        <span className="text-xs text-muted-foreground">233123. Your Name</span>
        <span className="rounded-md bg-card px-3 py-1 text-[11px] font-semibold">
          120 XP
        </span>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-[980px] space-y-10 pb-10">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card shadow-[0_16px_40px_rgba(15,12,24,0.08)] p-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              Top 10 Today
            </h2>
            {renderPodium()}
            {renderRows()}
          </section>

          <section className="rounded-xl border border-border bg-card shadow-[0_16px_40px_rgba(15,12,24,0.08)] p-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              Top 10 All-Time
            </h2>
            {renderPodium()}
            {renderRows()}
          </section>
        </>
      )}
    </div>
  )
}
