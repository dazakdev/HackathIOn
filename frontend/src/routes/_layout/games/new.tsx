import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { BookOpen, Settings2, ShieldAlert, Zap, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { GamesApi } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_layout/games/new")({
  component: NewGame,
  head: () => ({ meta: [{ title: "Nowa gra - Sensai" }] }),
})

function NewGame() {
  const navigate = useNavigate()
  const setGame = useGameStore((s) => s.setGame)

  // Game state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [text, setText] = useState("")
  const [difficulty, setDifficulty] = useState("easy")

  const { mutate, isPending } = useMutation({
    mutationFn: (source_text: string) => GamesApi.createGame(source_text),
    // Note: The backend currently only accepts source_text, but we keep the other
    // state (title, difficulty) locally ready for when the API is updated.
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
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Nowa sesja nauki</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Skonfiguruj parametry sesji i wklej tekst źródłowy. Sensai zajmie się resztą.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Config */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5 text-primary" /> Metadane
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nazwa sesji</label>
                <Input
                  placeholder="Np. Historia starożytnego Rzymu"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Opis (opcjonalny)</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  placeholder="Krótki opis czego dotyczy materiał..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" /> Poziom Trudności
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[
                  { id: "easy", label: "Łatwy", desc: "Podstawowe pytania" },
                  { id: "medium", label: "Średni", desc: "Wymaga zrozumienia" },
                  { id: "hard", label: "Trudny", desc: "Ekspercki poziom detali" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setDifficulty(lvl.id)}
                    disabled={isPending}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${difficulty === lvl.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="font-bold">{lvl.label}</div>
                    <div className="text-xs text-muted-foreground">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Source Text */}
        <div className="md:col-span-2 space-y-6">
          <Card className="h-full flex flex-col shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" /> Tekst źródłowy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4 pt-6">
              <div className="flex-1 min-h-[300px]">
                <textarea
                  className="w-full h-full min-h-[350px] rounded-xl border bg-background px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono leading-relaxed"
                  placeholder="Wklej tutaj tekst do nauki (min. 80 znaków)…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span className={text.length >= 80 ? "text-green-500" : "text-muted-foreground"}>
                  {text.length} znaków
                </span>
                {text.length < 80 && text.length > 0 && (
                  <span className="text-destructive font-semibold">Wymagane min. 80 znaków</span>
                )}
              </div>

              <div className="pt-4 border-t mt-auto">
                <Button
                  size="lg"
                  className="w-full gap-2 text-lg h-14"
                  disabled={isPending || text.trim().length < 80}
                  onClick={() => mutate(text.trim())}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generuję quiz przez AI…
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" /> Utwórz sesję i wygeneruj quiz
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
