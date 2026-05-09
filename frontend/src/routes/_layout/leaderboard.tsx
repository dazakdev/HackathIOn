import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Trophy } from "lucide-react"
import { GamesApi } from "@/lib/gameApi"
import useAuth from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/leaderboard")({
  component: LeaderboardPage,
  head: () => ({ meta: [{ title: "Ranking - Sensai" }] }),
})

const MEDALS = ["🥇", "🥈", "🥉"]

function LeaderboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: GamesApi.getLeaderboard,
    refetchInterval: 30_000,
  })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ranking</h1>
          <p className="text-muted-foreground text-sm">Top uczniów Sensai</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Wyniki globalne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-4">
            {data?.map((entry, idx) => {
              const isMe = entry.id === user?.id
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40"}`}
                >
                  <span className="w-8 text-center text-xl shrink-0">
                    {idx < 3 ? MEDALS[idx] : <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                      {entry.full_name ?? entry.email.split("@")[0]}
                      {isMe && <span className="ml-1 text-xs opacity-70">(Ty)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{entry.total_points}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              )
            })}

            {data?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Brak wyników. Bądź pierwszy!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
