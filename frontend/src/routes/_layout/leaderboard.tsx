import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Medal, Trophy } from "lucide-react"
import { GamesApi } from "@/lib/gameApi"

export const Route = createFileRoute("/_layout/leaderboard")({
  component: LeaderboardPage,
  head: () => ({ meta: [{ title: "Ranking - Treneiro" }] }),
})

function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: GamesApi.getLeaderboard,
    refetchInterval: 30_000,
  })

  const entries = data ?? []
  const topThree = entries.slice(0, 3)
  const rest = entries.slice(3, 10)

  const renderPodium = () => {
    const p1 = topThree[0]
    const p2 = topThree[1]
    const p3 = topThree[2]

    if (entries.length === 0) return null

    return (
      <div className="flex items-end justify-center gap-8 md:gap-16 py-16 mb-8 overflow-x-auto min-h-[300px]">
        {/* 2nd Place */}
        {p2 && (
          <div className="flex flex-col items-center group animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative mb-4">
              <div className="size-16 rounded-full border-4 border-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-2xl font-black text-slate-500">2</span>
              </div>
            </div>
            <div className="h-24 w-32 bg-slate-200/30 dark:bg-slate-800/50 rounded-t-2xl flex flex-col items-center justify-end pb-4 border-x border-t border-slate-300/30 backdrop-blur-sm shadow-xl">
              <p className="text-[11px] font-bold text-foreground truncate px-2 max-w-full">
                {p2.full_name || p2.email.split("@")[0]}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                {p2.total_points.toLocaleString()} XP
              </p>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {p1 && (
          <div className="flex flex-col items-center group -mx-2 z-10 scale-110 -translate-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="relative mb-6">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                <Trophy className="size-6 text-yellow-500 fill-yellow-500/20" />
              </div>
              <div className="size-20 rounded-full border-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.3)] group-hover:scale-105 transition-transform">
                <span className="text-2xl font-black text-yellow-600">1</span>
              </div>
            </div>
            <div className="h-36 w-36 bg-yellow-400/10 dark:bg-yellow-500/10 rounded-t-2xl flex flex-col items-center justify-end pb-6 border-x border-t border-yellow-400/30 backdrop-blur-md shadow-2xl">
              <p className="text-xs font-black text-foreground truncate px-2 max-w-full">
                {p1.full_name || p1.email.split("@")[0]}
              </p>
              <p className="text-[11px] font-black text-yellow-600 uppercase tracking-tighter">
                {p1.total_points.toLocaleString()} XP
              </p>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {p3 && (
          <div className="flex flex-col items-center group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="relative mb-4">
              <div className="size-16 rounded-full border-4 border-amber-600/30 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-2xl font-black text-amber-700">3</span>
              </div>
            </div>
            <div className="h-20 w-32 bg-amber-700/10 dark:bg-amber-900/20 rounded-t-2xl flex flex-col items-center justify-end pb-4 border-x border-t border-amber-700/20 backdrop-blur-sm shadow-xl">
              <p className="text-[11px] font-bold text-foreground truncate px-2 max-w-full">
                {p3.full_name || p3.email.split("@")[0]}
              </p>
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-tighter">
                {p3.total_points.toLocaleString()} XP
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRows = () => (
    <div className="space-y-2">
      {rest.length > 0 ? (
        rest.map((entry, idx) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-xl bg-muted/40 hover:bg-muted/60 px-5 py-4 text-sm transition-all hover:translate-x-1 duration-200 border border-border/5"
          >
            <div className="flex items-center gap-4">
              <span className="size-8 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground shadow-sm border border-border/50">
                {idx + 4}
              </span>
              <span className="font-bold text-foreground">
                {entry.full_name ?? entry.email.split("@")[0]}
              </span>
            </div>
            <span className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-black tracking-tight">
              {entry.total_points.toLocaleString("pl-PL")} XP
            </span>
          </div>
        ))
      ) : entries.length <= 3 ? (
        <div className="text-center text-xs text-muted-foreground py-12 italic opacity-50">
          Więcej uczniów wkrótce...
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-12">
          Brak wyników
        </div>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-[980px] space-y-10 pb-10">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <section className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />

          <div className="flex flex-col items-center mb-10 text-center">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Trophy className="size-6" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Ranking Mistrzów
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Najlepsi uczniowie w krainie wiedzy
            </p>
          </div>

          {renderPodium()}

          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4 px-4">
              <Medal className="size-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Top 10 Uczniów
              </span>
            </div>
            {renderRows()}
          </div>
        </section>
      )}
    </div>
  )
}
