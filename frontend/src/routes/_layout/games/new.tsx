import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { BookOpen, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { GamesApi } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/games/new")({
  component: NewGame,
  head: () => ({ meta: [{ title: "Nowa gra - Sensai" }] }),
})

function NewGame() {
  const navigate = useNavigate()
  const setGame = useGameStore((s) => s.setGame)
  const [text, setText] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: (source_text: string) => GamesApi.createGame(source_text),
    onSuccess: (data) => {
      setGame(data.id, "quiz")
      toast.success("Gra utworzona! Quiz gotowy.")
      navigate({ to: "/games/$gameId/quiz", params: { gameId: data.id } })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Błąd tworzenia gry")
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nowa sesja nauki</h1>
        <p className="text-muted-foreground mt-1">
          Wklej dowolny tekst — Sensai wygeneruje quiz, trening i walkę z bossem.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-primary" /> Tekst źródłowy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full min-h-[300px] rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono leading-relaxed"
            placeholder="Wklej tutaj tekst do nauki (min. 80 znaków)…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{text.length} znaków</span>
            {text.length < 80 && text.length > 0 && (
              <span className="text-destructive">Min. 80 znaków</span>
            )}
          </div>
          <Button
            className="w-full gap-2"
            disabled={isPending || text.trim().length < 80}
            onClick={() => mutate(text.trim())}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generuję quiz przez AI…
              </>
            ) : (
              "Utwórz grę i wygeneruj quiz"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
