import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  CheckCircle,
  ChevronRight,
  Clock3,
  Loader2,
  Moon,
  Sun,
  X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { GamesApi, type QuizQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"

export const Route = createFileRoute("/_layout/games/$gameId/quiz")({
  component: QuizPage,
  head: () => ({ meta: [{ title: "Quiz - Sensai" }] }),
})

const OPTION_KEYS = ["A", "B", "C", "D"] as const

function OptionButton({
  label,
  text,
  selected,
  correct,
  revealed,
  onClick,
}: {
  label: string
  text: string
  selected: boolean
  correct: boolean
  revealed: boolean
  onClick: () => void
}) {
  let cls =
    "w-full text-left bg-secondary/50 rounded-lg border px-4 py-3 text-sm transition-all duration-200 flex items-start gap-3 "
  if (!revealed) {
    cls += selected
      ? "border-primary bg-primary/20"
      : "border-border/60 bg-card/80 hover:border-primary/40 hover:bg-card"
  } else if (correct) {
    cls +=
      "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 font-medium"
  } else if (selected && !correct) {
    cls +=
      "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-medium"
  } else {
    cls += "border-border/50"
  }

  return (
    <button
      type="button"
      className={cls}
      onClick={revealed ? undefined : onClick}
      disabled={revealed}
    >
      <span
        className={`shrink-0 size-8 rounded-md border flex items-center justify-center text-xs font-semibold ${selected ? "border-primary/20 bg-primary/20 text-primary-foreground" : "border-border text-muted-foreground"}`}
      >
        {label}
      </span>
      <span className="leading-relaxed text-sm">{text}</span>
    </button>
  )
}

function QuestionCard({
  question,
  existingAnswer,
  onAnswered,
}: {
  question: QuizQuestionData
  existingAnswer?: { selected_option: string; is_correct: boolean | null }
  onAnswered: (allDone: boolean) => void
}) {
  const [selected, setSelected] = useState<string | null>(
    existingAnswer?.selected_option ?? null,
  )
  const [result, setResult] = useState<{
    is_correct: boolean
    correct_answer: string
    explanation: string | null
  } | null>(
    existingAnswer?.selected_option
      ? {
          is_correct: existingAnswer.is_correct ?? false,
          correct_answer: "",
          explanation: null,
        }
      : null,
  )

  const { gameId } = Route.useParams()
  const { mutate, isPending } = useMutation({
    mutationFn: (option: string) =>
      GamesApi.submitQuizAnswer(gameId, question.id, option),
    onSuccess: (data) => {
      setResult({
        is_correct: data.is_correct,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
      })
      onAnswered(data.all_answered)
    },
    onError: () => toast.error("Błąd zapisu odpowiedzi"),
  })

  const [showExplanation, setShowExplanation] = useState(false)

  const opts: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  }
  const revealed = result !== null

  if (showExplanation && result?.explanation) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <CheckCircle className="h-4 w-4" /> Wyjaśnienie
        </div>
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-sm leading-relaxed text-foreground/80 italic">
          "{result.explanation}"
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs font-bold uppercase tracking-wider border border-primary/20 hover:bg-primary/10 transition-colors"
          onClick={() => setShowExplanation(false)}
        >
          Powrót do pytania
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold leading-relaxed text-foreground/90">
        {question.question_text}
      </h3>

      <div className="space-y-3">
        {OPTION_KEYS.map((key) => (
          <OptionButton
            key={key}
            label={key}
            text={opts[key]}
            selected={selected === key}
            correct={revealed && result?.correct_answer?.toUpperCase() === key}
            revealed={revealed}
            onClick={() => {
              if (isPending || revealed) return
              setSelected(key)
              mutate(key)
            }}
          />
        ))}
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 text-xs text-primary py-2">
          <Loader2 className="h-4 w-4 animate-spin" />{" "}
          <span>Sprawdzam odpowiedź…</span>
        </div>
      )}

      {revealed && result && (
        <div className="flex flex-col gap-3">
          <div
            className={`rounded-md px-4 py-2 text-xs font-semibold flex items-center gap-2 ${
              result.is_correct
                ? "bg-green-500/20 text-green-700 dark:text-green-300"
                : "bg-red-500/20 text-red-700 dark:text-red-300"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {result.is_correct
              ? "Doskonale! To poprawna odpowiedź."
              : `Błędna odpowiedź. Poprawna to ${result.correct_answer}.`}
          </div>

          {result.explanation && (
            <button
              type="button"
              onClick={() => setShowExplanation(true)}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-md px-3 py-1.5 transition-all flex items-center gap-1.5 w-fit"
            >
              Zobacz wyjaśnienie <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function QuizPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const setPhase = useGameStore((s) => s.setPhase)
  const setReadingProgress = useGameStore((s) => s.setReadingProgress)
  const queryClient = useQueryClient()

  const { resolvedTheme, setTheme } = useTheme()

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [allAnswered, setAllAnswered] = useState(false)
  const sourceRef = useRef<HTMLDivElement>(null)
  const saveProgressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", gameId],
    queryFn: () => GamesApi.getQuiz(gameId),
  })

  useEffect(() => {
    if (!quiz) return
    const answered = Object.keys(quiz.answers ?? {})
    const allDone = answered.length >= (quiz.questions?.length ?? 0)
    setAllAnswered(allDone)
    if (allDone) setCurrentQuestion((quiz.questions?.length ?? 1) - 1)
  }, [quiz])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const handleScroll = useCallback(() => {
    const el = sourceRef.current
    if (!el) return
    const progress = Math.round(
      (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100,
    )
    if (saveProgressTimer.current) clearTimeout(saveProgressTimer.current)
    saveProgressTimer.current = setTimeout(() => {
      setReadingProgress(progress)
      GamesApi.updateProgress(gameId, progress)
    }, 500)
  }, [gameId, setReadingProgress])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium text-lg">
          Ładuję sesję quizu…
        </span>
      </div>
    )
  }

  if (!quiz) return null

  const questions = quiz.questions ?? []
  const q = questions[currentQuestion]

  const goToTraining = async () => {
    setPhase("training")
    toast.success("Quiz ukończony! Zaczynamy trening.")
    await GamesApi.startTraining(gameId)
    queryClient.invalidateQueries({ queryKey: ["games"] })
    navigate({ to: "/games/$gameId/training", params: { gameId } })
  }

  const answeredCount = Object.keys(quiz.answers ?? {}).length
  const progressPercent =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0

  return (
    <div className="min-h-svh bg-[url('/background.jpg')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-background/30 dark:bg-background/60" />

      <div className="relative z-10 flex flex-col min-h-svh">
        <header className="h-12 bg-background/90 border-b border-border flex items-center px-6 text-sm">
          <button
            type="button"
            className="flex items-center gap-2 font-semibold"
            onClick={() => navigate({ to: "/" })}
          >
            <X className="h-4 w-4" /> {quiz.title}
          </button>
          <div className="flex-1 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">
              Część {currentQuestion + 1} z {questions.length}
            </span>
            <div className="w-40 h-1.5 rounded-md bg-muted overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="size-8 rounded-md border border-border bg-card flex items-center justify-center transition-all hover:bg-muted"
              title="Zmień motyw"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-yellow-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Clock3 className="h-4 w-4" /> 12:45
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-5xl h-[600px] grid md:grid-cols-[1.5fr_1fr] gap-0 rounded-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.25)]">
            <section className="bg-white/95 dark:bg-card/90 p-8 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
                <span className="rounded-md bg-muted px-3 py-1">Filozofia</span>
              </div>
              <h2 className="text-2xl font-semibold mb-4">{quiz.title}</h2>
              <blockquote className="border-l-2 border-border pl-4 text-sm text-muted-foreground mb-6">
                "Nie rzeczy nas niepokoją, lecz nasze o nich wyobrażenia." –
                Epiktet
              </blockquote>
              <div
                ref={sourceRef}
                onScroll={handleScroll}
                className="text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto pr-4 min-h-0"
              >
                {quiz.source_text ?? (
                  <span className="text-muted-foreground italic">
                    Wróć do głównej strony gry, aby zobaczyć tekst.
                  </span>
                )}
              </div>
            </section>

            <section className="bg-[#f4f2f5]/25 dark:bg-secondary/20 backdrop-blur-md p-8 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 min-h-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="size-6 rounded-md bg-primary/20 flex items-center justify-center text-primary">
                    ?
                  </span>
                  {quiz.status === "training_ready"
                    ? "Quiz ukończony!"
                    : "Sprawdź wiedzę"}
                </div>

                {quiz.status === "training_ready" ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10">
                    <div className="size-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold">
                      Wszystkie odpowiedzi udzielone!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Twój uczeń przyswoił podstawową wiedzę z tekstu. Teraz
                      czas sprawdzić, jak poradzi sobie z Twoimi wyjaśnieniami w
                      sesji treningowej.
                    </p>
                  </div>
                ) : (
                  q && (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      existingAnswer={quiz.answers?.[q.id] as any}
                      onAnswered={(done) => {
                        queryClient.invalidateQueries({
                          queryKey: ["quiz", gameId],
                        })
                        if (done) {
                          setAllAnswered(true)
                        }
                      }}
                    />
                  )
                )}
              </div>

              <div className="pt-6">
                {allAnswered || quiz.status === "training_ready" ? (
                  <Button
                    size="lg"
                    className="w-full rounded-lg font-semibold bg-white text-black hover:bg-white/90"
                    onClick={goToTraining}
                  >
                    Przejdź do treningu{" "}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-lg font-semibold bg-white text-black hover:bg-white/90"
                    onClick={() =>
                      setCurrentQuestion((p) =>
                        Math.min(questions.length - 1, p + 1),
                      )
                    }
                    disabled={!quiz.answers?.[q.id]}
                  >
                    Kolejne pytanie
                  </Button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
