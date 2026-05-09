import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2, Shield, Swords, Trophy, Zap } from "lucide-react"
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
}: {
  current: number
  max: number
  label: string
  color: string
}) {
  const pct = max > 0 ? Math.max(0, Math.min((current / max) * 100, 100)) : 0
  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between text-xs font-semibold">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-4 rounded-full bg-muted overflow-hidden border border-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
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
      <div className="max-w-lg mx-auto space-y-8 text-center pt-10">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Faza 3
          </p>
          <h1 className="text-4xl font-black tracking-tight">Walka z Bossem</h1>
          <p className="text-muted-foreground">
            Twoje odpowiedzi z treningu zostaną użyte jako ataki. Czy jesteś gotowy?
          </p>
        </div>
        <div className="rounded-2xl border border-dashed p-10 space-y-4">
          <div className="text-8xl select-none">👹</div>
          <p className="text-xl font-bold">IGNORANT</p>
          <p className="text-sm text-muted-foreground">Boss wiedzy</p>
        </div>
        <Button
          size="lg"
          className="gap-3 px-8 py-6 text-lg font-bold"
          onClick={() => {
            setPhaseState("loading")
            startBattle()
          }}
        >
          <Swords className="h-6 w-6" /> Zacznij Walkę!
        </Button>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Przygotowuję walkę…</span>
      </div>
    )
  }

  if (phase === "victory" || phase === "defeat") {
    const isVictory = phase === "victory"
    return (
      <div className="max-w-lg mx-auto text-center space-y-8 pt-10">
        <div className="text-8xl select-none animate-bounce">
          {isVictory ? "🏆" : "💀"}
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black">
            {isVictory ? "Zwycięstwo!" : "Porażka"}
          </h1>
          <p className="text-muted-foreground">
            {isVictory
              ? "Pokonałeś Bossa wiedzy! Doskonała robota."
              : "Boss przeżył, ale zrobiłeś postęp!"}
          </p>
        </div>

        {result && (
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: "XP Zdobyte", value: `+${result.xp_gained}`, icon: "⚡" },
              { label: "Celność", value: `${Math.round(result.accuracy_avg)}%`, icon: "🎯" },
              { label: "Max Combo", value: `x${result.combo_count}`, icon: "🔥" },
              {
                label: "Obrażenia",
                value: `${result.player_damage_total}/${result.boss_hp_start}`,
                icon: "⚔️",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border bg-card p-4 space-y-1"
              >
                <p className="text-2xl">{stat.icon}</p>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/" })}
          >
            Dashboard
          </Button>
          <Button
            className="gap-2"
            onClick={() =>
              navigate({ to: "/games/$gameId/summary", params: { gameId } })
            }
          >
            <Trophy className="h-4 w-4" /> Podsumowanie
          </Button>
        </div>
      </div>
    )
  }

  // Animating phase
  const hpPercent = bossHpMax > 0 ? (bossHp / bossHpMax) * 100 : 0
  const bossEmoji = hpPercent > 60 ? "👹" : hpPercent > 30 ? "😤" : "💀"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Boss Fight
        </p>
        <h1 className="text-2xl font-black">IGNORANT</h1>
      </div>

      {/* Arena */}
      <div className="relative rounded-2xl border bg-gradient-to-b from-muted/30 to-muted/10 p-8 overflow-hidden min-h-[280px] flex items-center justify-center">
        {/* Boss character */}
        <div
          className={`text-center transition-transform duration-150 ${bossShake ? "translate-x-2" : ""}`}
          style={{
            filter: bossShake ? "brightness(2)" : "brightness(1)",
            transition: bossShake
              ? "filter 0.1s"
              : "filter 0.3s, transform 0.15s",
          }}
        >
          <div className="text-8xl select-none">{bossEmoji}</div>
          <p className="text-sm font-bold mt-2">Boss</p>
        </div>

        {/* Player */}
        <div
          className={`absolute bottom-6 left-8 text-center transition-transform duration-200 ${playerAttack ? "-translate-y-4 translate-x-4" : ""}`}
        >
          <div className="text-5xl select-none">🧙</div>
          <p className="text-xs font-bold mt-1 text-muted-foreground">Ty</p>
        </div>

        {/* Floating damage number */}
        {floatingDamage && (
          <div
            key={floatingDamage.id}
            className="absolute top-4 right-8 text-center animate-bounce pointer-events-none"
            style={{ animationDuration: "0.4s", animationIterationCount: "2" }}
          >
            <p
              className={`font-black ${floatingDamage.combo >= 3 ? "text-3xl text-yellow-400" : "text-2xl text-white"}`}
            >
              -{floatingDamage.val}
            </p>
            {floatingDamage.combo >= 2 && (
              <p className="text-xs font-bold text-orange-400">
                COMBO x{floatingDamage.combo}!
              </p>
            )}
          </div>
        )}

        {/* Attack flash */}
        {playerAttack && (
          <div className="absolute inset-0 bg-primary/10 rounded-2xl pointer-events-none animate-ping" />
        )}
      </div>

      {/* HP bars */}
      <div className="space-y-3">
        <HpBar
          current={bossHp}
          max={bossHpMax}
          label="Boss HP"
          color={
            hpPercent > 60
              ? "bg-red-500"
              : hpPercent > 30
                ? "bg-orange-500"
                : "bg-yellow-500"
          }
        />
      </div>

      {/* Turn info */}
      {currentTurn && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm">
              <Swords className="h-4 w-4 text-primary" />
              <span className="font-semibold">Obrażenia:</span>
              <span className="text-primary font-bold">-{currentTurn.damage}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="font-semibold">Precyzja:</span>
              <span>{currentTurn.score}/100</span>
            </div>
            {currentTurn.combo >= 2 && (
              <div className="flex items-center gap-1.5 text-sm text-orange-400 font-bold">
                🔥 COMBO x{currentTurn.combo}!
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Tura {currentTurnIndex + 1}/{result?.turns.length ?? 0} — Łączne obrażenia:{" "}
            {totalDamageDealt}
          </div>
        </div>
      )}

      {/* Turn dots */}
      {result && (
        <div className="flex gap-1 flex-wrap">
          {result.turns.map((t, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i < currentTurnIndex
                  ? t.score >= 70
                    ? "bg-green-500"
                    : "bg-red-500"
                  : i === currentTurnIndex
                    ? "bg-primary scale-125"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
