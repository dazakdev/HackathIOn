import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2, Swords, Trophy, Zap, Play } from "lucide-react"
import { useRef, useState } from "react"
import { GamesApi, type BossSimulationResult, type BossTurn } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/games/$gameId/boss")({
  component: BossPage,
  head: () => ({ meta: [{ title: "Boss Fight - Sensai" }] }),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function HpBar({
  current,
  max,
  label,
  color,
  isBoss = false
}: {
  current: number
  max: number
  label: string
  color: string
  isBoss?: boolean
}) {
  const pct = max > 0 ? Math.max(0, Math.min((current / max) * 100, 100)) : 0
  return (
    <div className={`space-y-1.5 w-full ${isBoss ? "flex flex-col items-end" : ""}`}>
      <div className={`flex justify-between text-sm font-bold uppercase tracking-wider text-white drop-shadow-md w-full ${isBoss ? "flex-row-reverse" : ""}`}>
        <span>{label}</span>
        <span className="opacity-90 font-mono">
          {Math.round(current)}/{max}
        </span>
      </div>
      <div className={`h-6 w-full max-w-sm rounded-full bg-black/60 overflow-hidden border-2 border-white/20 backdrop-blur-sm ${isBoss ? "ml-auto" : ""}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] ${color} ${isBoss ? "ml-auto" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

type BattlePhase = "ready" | "loading" | "animating" | "victory" | "defeat"

function BossPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const setPhase = useGameStore((s) => s.setPhase)
  const queryClient = useQueryClient()

  const [phase, setPhaseState] = useState<BattlePhase>("ready")
  const [result, setResult] = useState<BossSimulationResult | null>(null)
  const [bossHp, setBossHp] = useState(0)
  const [bossHpMax, setBossHpMax] = useState(0)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1)
  const [floatingDamage, setFloatingDamage] = useState<{
    val: number
    combo: number
    id: number
  } | null>(null)
  const [bossShake, setBossShake] = useState(false)
  const [playerAttack, setPlayerAttack] = useState(false)
  const [totalDamageDealt, setTotalDamageDealt] = useState(0)
  const dmgIdRef = useRef(0)
  const isAnimating = useRef(false)

  const { mutate: startBattle } = useMutation({
    mutationFn: () => GamesApi.startBossBattle(gameId),
    onSuccess: async (data) => {
      setResult(data)
      setBossHpMax(data.boss_hp_start)
      setBossHp(data.boss_hp_start)
      setPhaseState("animating")
      await animateBattle(data)
    },
    onError: () => setPhaseState("ready"),
  })

  const animateBattle = async (data: BossSimulationResult) => {
    if (isAnimating.current) return
    isAnimating.current = true

    for (let i = 0; i < data.turns.length; i++) {
      const turn = data.turns[i]
      setCurrentTurnIndex(i)

      // Player attacks
      setPlayerAttack(true)
      await sleep(300)
      setPlayerAttack(false)

      // Boss gets hit
      setBossShake(true)
      setBossHp(turn.boss_hp_after)
      setTotalDamageDealt((p) => p + turn.damage)

      // Show floating damage
      dmgIdRef.current += 1
      setFloatingDamage({ val: turn.damage, combo: turn.combo, id: dmgIdRef.current })

      await sleep(400)
      setBossShake(false)

      await sleep(600)
      setFloatingDamage(null)

      await sleep(400)
    }

    isAnimating.current = false

    if (data.victory) {
      setPhaseState("victory")
      setPhase("summary")
      queryClient.invalidateQueries({ queryKey: ["games"] })
    } else {
      setPhaseState("defeat")
      setPhase("summary")
      queryClient.invalidateQueries({ queryKey: ["games"] })
    }
  }

  const currentTurn: BossTurn | undefined =
    result?.turns[currentTurnIndex] ?? undefined

  if (phase === "ready") {
    return (
      <div className="max-w-3xl mx-auto space-y-8 text-center pt-10">
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-widest text-primary bg-primary/10 inline-block px-4 py-1.5 rounded-full">
            Faza Finałowa
          </p>
          <h1 className="text-5xl font-black tracking-tight">Ostateczne Starcie</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Twój uczeń przyswoił wiedzę. Nadszedł czas na sprawdzian. Odpowiedzi z treningu posłużą jako siła waszych ataków!
          </p>
        </div>

        <div className="relative rounded-3xl border border-dashed bg-card shadow-sm p-12 overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-background to-background pointer-events-none" />

          <div className="relative z-10 animate-bounce" style={{ animationDuration: "3s" }}>
            <div className="text-[120px] leading-none select-none drop-shadow-2xl">👹</div>
          </div>

          <div className="relative z-10 mt-6 text-center">
            <h2 className="text-3xl font-black text-foreground">IGNORANT</h2>
            <p className="text-lg text-muted-foreground font-semibold mt-1 uppercase tracking-widest">Boss Wiedzy</p>
          </div>
        </div>

        <Button
          size="lg"
          className="gap-3 px-10 py-8 text-xl font-black w-full md:w-auto shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-2xl"
          onClick={() => {
            setPhaseState("loading")
            startBattle()
          }}
        >
          <Play className="h-6 w-6" /> ROZPOCZNIJ WALKĘ!
        </Button>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <Swords className="h-16 w-16 text-primary animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin text-primary absolute -bottom-2 -right-2 bg-background rounded-full" />
        </div>
        <h2 className="text-2xl font-black tracking-tight mt-4">Ładowanie Areny...</h2>
        <span className="text-muted-foreground font-medium">Przygotowuję statystyki starcia</span>
      </div>
    )
  }

  if (phase === "victory" || phase === "defeat") {
    const isVictory = phase === "victory"
    return (
      <div className="max-w-2xl mx-auto text-center space-y-10 pt-10">
        <div className="text-[140px] leading-none select-none animate-in zoom-in duration-500 drop-shadow-2xl">
          {isVictory ? "🏆" : "💀"}
        </div>
        <div className="space-y-4">
          <h1 className={`text-6xl font-black tracking-tight ${isVictory ? "text-yellow-500" : "text-destructive"}`}>
            {isVictory ? "ZWYCIĘSTWO!" : "PORAŻKA"}
          </h1>
          <p className="text-xl font-medium text-muted-foreground">
            {isVictory
              ? "Boss wiedzy pokonany! Twój uczeń doskonale opanował materiał."
              : "Boss okazał się zbyt trudny, ale każda porażka to nowa lekcja!"}
          </p>
        </div>

        {result && (
          <div className="grid grid-cols-2 gap-6 text-left">
            {[
              { label: "Zdobyte XP", value: `+${result.xp_gained}`, icon: "⚡", color: "text-yellow-500" },
              { label: "Celność", value: `${Math.round(result.accuracy_avg)}%`, icon: "🎯", color: "text-blue-500" },
              { label: "Max Combo", value: `x${result.combo_count}`, icon: "🔥", color: "text-orange-500" },
              {
                label: "Obrażenia",
                value: `${result.player_damage_total}/${result.boss_hp_start}`,
                icon: "⚔️",
                color: "text-red-500"
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 p-4 opacity-10 text-6xl ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="relative z-10 space-y-2">
                  <p className="text-3xl">{stat.icon}</p>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 justify-center pt-6">
          <Button
            size="lg"
            variant="outline"
            className="px-8 h-14 font-bold"
            onClick={() => navigate({ to: "/" })}
          >
            Wróć do Dashboardu
          </Button>
          <Button
            size="lg"
            className="gap-2 px-8 h-14 font-bold shadow-lg"
            onClick={() =>
              navigate({ to: "/games/$gameId/summary", params: { gameId } })
            }
          >
            <Trophy className="h-5 w-5" /> Pełne Podsumowanie
          </Button>
        </div>
      </div>
    )
  }

  // Animating phase
  const hpPercent = bossHpMax > 0 ? (bossHp / bossHpMax) * 100 : 0
  const bossEmoji = hpPercent > 60 ? "👹" : hpPercent > 30 ? "😤" : "💀"

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col rounded-3xl overflow-hidden border bg-background shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b z-10 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight">Ostateczne Starcie</h1>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Boss Fight</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold">Łączne obrażenia</p>
            <p className="text-xl font-black text-primary">{totalDamageDealt}</p>
          </div>
        </div>
      </div>

      {/* Arena Area */}
      <div className="flex-1 relative bg-black overflow-hidden flex flex-col justify-between">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/background.jpg')" }}
        />

        {/* Top HUD: Boss */}
        <div className="relative z-20 w-full p-6 flex justify-end">
          <HpBar
            current={bossHp}
            max={bossHpMax}
            label="IGNORANT"
            color={
              hpPercent > 60
                ? "bg-red-500"
                : hpPercent > 30
                  ? "bg-orange-500"
                  : "bg-yellow-500"
            }
            isBoss={true}
          />
        </div>

        {/* Battle Scene */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center -mt-10">
          {/* Boss */}
          <div
            className={`text-center transition-transform duration-150 ${bossShake ? "translate-x-4 -translate-y-2 scale-105" : "scale-100"}`}
            style={{
              filter: bossShake ? "brightness(2) drop-shadow(0 0 20px rgba(255,0,0,0.8))" : "drop-shadow(0 10px 10px rgba(0,0,0,0.5))",
              transition: bossShake
                ? "filter 0.05s"
                : "filter 0.3s, transform 0.15s",
            }}
          >
            <div className="text-[160px] leading-none select-none">{bossEmoji}</div>
          </div>

          {/* Floating damage number */}
          {floatingDamage && (
            <div
              key={floatingDamage.id}
              className="absolute top-1/4 right-1/4 text-center animate-out slide-out-to-top-8 fade-out duration-1000 pointer-events-none"
            >
              <p
                className={`font-black drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] ${floatingDamage.combo >= 3 ? "text-6xl text-yellow-300" : "text-5xl text-white"}`}
              >
                -{floatingDamage.val}
              </p>
              {floatingDamage.combo >= 2 && (
                <p className="text-xl font-black text-orange-400 mt-2 bg-black/50 px-3 py-1 rounded-full border border-orange-500/50">
                  COMBO x{floatingDamage.combo}!
                </p>
              )}
            </div>
          )}

          {/* Player */}
          <div
            className={`absolute bottom-10 left-16 text-center transition-transform duration-200 ${playerAttack ? "-translate-y-16 translate-x-16 scale-110" : "scale-100"}`}
            style={{ filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.5))" }}
          >
            <div className="text-[100px] leading-none select-none">🧙</div>
            <div className="mt-2 bg-black/50 px-3 py-1 rounded-full border border-white/20 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-sm">
              Twój Uczeń
            </div>
          </div>

          {/* Attack flash */}
          {playerAttack && (
            <div className="absolute inset-0 bg-white/20 z-30 pointer-events-none mix-blend-overlay" />
          )}
        </div>
      </div>

      {/* Turn Info Footer */}
      <div className="shrink-0 p-6 bg-card border-t z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        {currentTurn ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tura</span>
                <span className="text-2xl font-black">{currentTurnIndex + 1}<span className="text-muted-foreground text-lg">/{result?.turns.length ?? 0}</span></span>
              </div>

              <div className="h-10 w-px bg-border hidden md:block" />

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Swords className="h-3 w-3" /> Obrażenia</span>
                  <span className="text-xl font-black text-primary">-{currentTurn.damage}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Zap className="h-3 w-3" /> Precyzja</span>
                  <span className="text-xl font-black">{currentTurn.score}<span className="text-muted-foreground text-sm">/100</span></span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {currentTurn.combo >= 2 && (
                <div className="bg-orange-500/20 text-orange-500 border border-orange-500/30 px-3 py-1 rounded-full font-black text-sm animate-pulse">
                  🔥 COMBO x{currentTurn.combo}!
                </div>
              )}
              {/* Turn dots */}
              {result && (
                <div className="flex gap-1.5 mt-1">
                  {result.turns.map((t, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${i < currentTurnIndex
                          ? t.score >= 70
                            ? "bg-green-500"
                            : "bg-red-500"
                          : i === currentTurnIndex
                            ? "bg-primary scale-150 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            : "bg-muted"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}
