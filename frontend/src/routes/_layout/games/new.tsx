import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  ArrowLeft,
  BookOpen,
  FolderOpen,
  Loader2,
  ShieldAlert,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GamesApi } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"

const ICONS = [
  { id: "zap", char: "⚡" },
  { id: "sparkles", char: "✨" },
  { id: "brain", char: "🧠" },
] as const

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
  const [selectedIcon, setSelectedIcon] = useState("sparkles")

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      text,
      difficulty,
      icon,
    }: { text: string; difficulty: string; icon: string }) =>
      GamesApi.createGame(text, difficulty, icon),
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
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="h-4 w-4" /> Przerwij
            </button>
            <Logo variant="icon" className="h-6 w-auto" asLink={false} />
          </div>
        </div>

        <div className="text-center mt-12 space-y-2 text-white">
          <h1 className="text-3xl font-semibold">Wykuj nową wiedzę</h1>
          <p className="text-sm text-white/80">
            Zostań najlepszym posiadaczem wiedzy i naucz swojego ucznia, który
            stanie do walki w imię świętej wiedzy
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
                  <label
                    htmlFor="adventure-name"
                    className="text-xs font-semibold"
                  >
                    Nazwa
                  </label>
                  <Input
                    id="adventure-name"
                    placeholder="Nazwa przygody..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    className="rounded-lg bg-background/70 dark:bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-semibold block">Ikona</span>
                  <div className="flex items-center gap-3">
                    {ICONS.map((icon) => (
                      <button
                        type="button"
                        key={icon.id}
                        onClick={() => setSelectedIcon(icon.id)}
                        disabled={isPending}
                        className={`size-9 rounded-full border text-sm transition-all duration-200 ${selectedIcon === icon.id ? "bg-primary text-primary-foreground border-primary shadow-md scale-110" : "bg-background/70 dark:bg-black/20 border-border hover:border-primary/40 hover:scale-105"}`}
                      >
                        {icon.char}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="adventure-desc"
                  className="text-xs font-semibold"
                >
                  Opis
                </label>
                <textarea
                  id="adventure-desc"
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
                {
                  id: "easy",
                  label: "Uczeń",
                  desc: "Podstawowe testy wyboru i fiszki.",
                },
                {
                  id: "medium",
                  label: "Czeladnik",
                  desc: "Zadania otwarte i analiza kontekstu.",
                },
                {
                  id: "hard",
                  label: "Mistrz",
                  desc: "Rygorystyczne testy syntezy i luk.",
                },
              ].map((lvl) => (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => setDifficulty(lvl.id)}
                  disabled={isPending}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    difficulty === lvl.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/60 dark:bg-black/20 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Circular radio indicator */}
                    <div
                      className={`size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        difficulty === lvl.id
                          ? "border-primary"
                          : "border-muted-foreground/50"
                      }`}
                    >
                      {difficulty === lvl.id && (
                        <div className="size-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          lvl.id === "hard" ? "text-primary" : ""
                        }`}
                      >
                        {lvl.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lvl.desc}
                      </div>
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
            onClick={() =>
              mutate({ text: text.trim(), difficulty, icon: selectedIcon })
            }
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
