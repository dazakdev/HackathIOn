import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, FolderOpen, ShieldAlert, Zap, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { GamesApi } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-svh relative bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-[#8e89a8]/80 dark:bg-black/70" />

      <div className="relative z-10 flex flex-col items-center px-6 pb-16">
        <div className="w-full max-w-5xl pt-8">
          <div className="rounded-lg bg-card/90 dark:bg-black/30 border border-white/30 dark:border-white/10 px-6 py-3 flex items-center justify-between shadow-lg">
            <button className="flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Przerwij
            </button>
            <Logo variant="icon" className="h-6 w-auto" asLink={false} />
          </div>
        </div>

        <div className="text-center mt-12 space-y-2 text-white">
          <h1 className="text-3xl font-semibold">Wykuj nową wiedzę</h1>
          <p className="text-sm text-white/80">
            Zostań najlepszym posiadaczem wiedzy i naucz swojego ucznia,
            który stanie do walki w imię świętej wiedzy
          </p>
        </div>

        <div className="w-full max-w-2xl mt-10 space-y-6">
          <section className="rounded-lg bg-card/90 dark:bg-[#2f2f2f]/80 border border-white/30 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <div className="px-6 py-4 flex items-center gap-2 text-sm font-semibold">
              <FolderOpen className="h-4 w-4" /> Materiał Źródłowy
            </div>
            <div className="px-6 pb-6">
              <textarea
                className="w-full min-h-[160px] rounded-lg border border-border/50 bg-background/70 dark:bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Wklej tutaj notatki, fragment artykułu lub definicje pojęć..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isPending}
              />
            </div>
          </section>

          <section className="rounded-lg bg-card/90 dark:bg-[#2f2f2f]/80 border border-white/30 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <div className="px-6 py-4 flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4" /> Modyfikuj przygodę
            </div>
            <div className="px-6 pb-6 grid gap-4 md:grid-cols-[1fr_1.2fr]">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Nazwa</label>
                  <Input
                    placeholder="Nazwa przygody..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    className="rounded-lg bg-background/70 dark:bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Ikona</label>
                  <div className="flex items-center gap-3">
                    {["⚡", "✨", "🧠"].map((icon) => (
                      <button
                        key={icon}
                        className={`size-9 rounded-md border text-sm ${icon === "✨" ? "bg-primary text-primary-foreground border-primary" : "bg-background/70 dark:bg-black/20 border-border"}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Opis</label>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-border/50 bg-background/70 dark:bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Opis przygody..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-card/90 dark:bg-[#2f2f2f]/80 border border-white/30 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <div className="px-6 py-4 flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4" /> Poziom Trudności
            </div>
            <div className="px-6 pb-6 space-y-3">
              {[
                { id: "easy", label: "Uczeń", desc: "Podstawowe testy wyboru i fiszki." },
                { id: "medium", label: "Czeladnik", desc: "Zadania otwarte i analiza kontekstu." },
                { id: "hard", label: "Mistrz", desc: "Rygorystyczne testy syntezy i luk." },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setDifficulty(lvl.id)}
                  disabled={isPending}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    difficulty === lvl.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/60 dark:bg-black/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-4 rounded-md border ${difficulty === lvl.id ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-semibold">{lvl.label}</div>
                      <div className="text-xs text-muted-foreground">{lvl.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10">
          <Button
            size="lg"
            className="rounded-lg px-10 py-6 text-base font-semibold shadow-xl"
            disabled={isPending || text.trim().length < 80}
            onClick={() => mutate(text.trim())}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generuję quiz…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" /> Stwórz przygodę
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
