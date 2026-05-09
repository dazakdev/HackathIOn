import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CheckCircle, ChevronRight, Loader2, XCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { GamesApi, type QuizQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
    "w-full text-left rounded-xl border p-3 text-sm transition-all duration-200 flex items-start gap-3 "
  if (!revealed) {
    cls += selected
      ? "border-primary bg-primary/10 ring-1 ring-primary"
      : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
  } else if (correct) {
    cls += "border-green-500 bg-green-500/10 text-green-400"
  } else if (selected && !correct) {
    cls += "border-red-500 bg-red-500/10 text-red-400"
  } else {
    cls += "border-border opacity-50"
  }

  return (
    <button className={cls} onClick={revealed ? undefined : onClick} disabled={revealed}>
      <span className="shrink-0 font-bold opacity-70">{label}.</span>
      <span>{text}</span>
    </button>
  )
}

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer,
  onAnswered,
}: {
  question: QuizQuestionData
  questionNumber: number
  totalQuestions: number
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

  const opts: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  }
  const revealed = result !== null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Pytanie {questionNumber}/{totalQuestions}
        </span>
      </div>
      <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>

      <div className="space-y-2">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Sprawdzam…
        </div>
      )}

      {revealed && result && (
        <div
          className={`rounded-xl p-3 text-sm ${result.is_correct ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}
        >
          <div className="flex items-center gap-2 font-semibold mb-1">
            {result.is_correct ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {result.is_correct ? "Poprawnie!" : `Błędnie. Prawidłowa odpowiedź: ${result.correct_answer}`}
          </div>
          {result.explanation && (
            <p className="text-xs opacity-80 mt-1">{result.explanation}</p>
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
        <span className="text-muted-foreground">Ładuję quiz…</span>
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Source text */}
      <div className="lg:w-1/2 flex flex-col min-h-0">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Tekst źródłowy
        </h2>
        <div
          ref={sourceRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto rounded-xl border bg-muted/30 p-5 text-sm leading-relaxed whitespace-pre-wrap scrollbar-thin"
        >
          {quiz.source_text ?? (
            <span className="text-muted-foreground italic">
              Wróć do głównej strony gry, aby zobaczyć tekst.
            </span>
          )}
        </div>
      </div>

      {/* Right: Quiz */}
      <div className="lg:w-1/2 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quiz — {quiz.title}
          </h2>
          <span className="text-xs text-muted-foreground">
            {Object.keys(quiz.answers ?? {}).length}/{questions.length} odpowiedzi
          </span>
        </div>

        {/* Question navigation dots */}
        <div className="flex gap-2 mb-4">
          {questions.map((_, i) => {
            const answerId = questions[i]?.id
            const isAnswered = answerId && (quiz.answers?.[answerId] != null)
            return (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`h-2 flex-1 rounded-full transition-all ${
                  i === currentQuestion
                    ? "bg-primary"
                    : isAnswered
                      ? "bg-green-500/60"
                      : "bg-muted"
                }`}
              />
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {q && (
            <Card>
              <CardContent className="p-5">
                <QuestionCard
                  question={q}
                  questionNumber={currentQuestion + 1}
                  totalQuestions={questions.length}
                  existingAnswer={
                    quiz.answers?.[q.id] as any
                  }
                  onAnswered={(done) => {
                    if (done) {
                      setAllAnswered(true)
                    } else if (currentQuestion < questions.length - 1) {
                      setTimeout(() => setCurrentQuestion((p) => p + 1), 1200)
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
            disabled={currentQuestion === 0}
          >
            Poprzednie
          </Button>

          {allAnswered ? (
            <Button className="gap-2" onClick={goToTraining}>
              Przejdź do treningu <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion((p) => Math.min(questions.length - 1, p + 1))}
              disabled={currentQuestion === questions.length - 1}
            >
              Następne
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
