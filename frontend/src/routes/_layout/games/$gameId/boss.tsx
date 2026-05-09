import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { GamesApi } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"

export const Route = createFileRoute("/_layout/games/$gameId/boss")({
  component: BossPage,
  head: () => ({ meta: [{ title: "Boss Fight - Sensai" }] }),
})

type BattlePhase = "loading" | "error"

function BossPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const setPhase = useGameStore((s) => s.setPhase)
  const queryClient = useQueryClient()
  const [phase, setPhaseState] = useState<BattlePhase>("loading")

  const { mutate: startBattle } = useMutation({
    mutationFn: () => GamesApi.startBossBattle(gameId),
    onSuccess: () => {
      setPhase("summary")
      queryClient.invalidateQueries({ queryKey: ["games"] })
      navigate({ to: "/games/$gameId/summary", params: { gameId } })
    },
    onError: () => setPhaseState("error"),
  })

  useEffect(() => {
    startBattle()
  }, [startBattle])

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <h2 className="text-xl font-semibold">Nie udalo sie uruchomic walki.</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Sprobuj odswiezyc strone lub wrocic do pulpitu.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-white/10 bg-[#2f2f2f] shadow-[0_30px_80px_rgba(0,0,0,0.4)] flex flex-col">
      <div className="h-12 bg-[#3b3b3b] flex items-center px-6 text-xs text-white/80">
        <div className="font-semibold">Wprowadzenie do Stoicyzmu</div>
        <div className="flex-1" />
        <div className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold">12,450 XP</div>
      </div>

      <div className="flex-1 grid md:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 flex flex-col items-center justify-center gap-6 p-6">
          <div className="rounded-lg bg-white text-black px-6 py-3 text-sm font-semibold shadow-lg text-center">
            Musze aktywowac wiecej neuronow !!!
          </div>
          <img src="/assets/images/student.gif" alt="Uczen" className="w-40" />
        </aside>

        <div className="flex flex-col items-center justify-center px-10 py-8">
          <div className="text-center space-y-2 mb-6">
            <span className="inline-flex items-center rounded-md bg-red-500/80 px-4 py-1 text-xs font-semibold text-white">HARD</span>
            <h2 className="text-2xl font-semibold text-white">Pidgey BOSS</h2>
            <p className="text-sm text-white/60">Trwa walka ...</p>
          </div>
          <div className="w-full max-w-2xl bg-black/10 rounded-lg p-4">
            <img src="/assets/images/battle.webp" alt="Battle" className="w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
