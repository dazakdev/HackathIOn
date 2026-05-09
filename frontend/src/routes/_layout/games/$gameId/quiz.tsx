import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CheckCircle, ChevronRight, Loader2, XCircle, BookOpen } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { GamesApi, type QuizQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"

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
    "w-full text-left rounded-xl border-2 p-4 text-base transition-all duration-200 flex items-start gap-4 "
  if (!revealed) {
    cls += selected
      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
      : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
  } else if (correct) {
    cls += "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 font-medium"
  } else if (selected && !correct) {
    cls += "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-medium"
  } else {
    cls += "border-border opacity-50"
  }

  return (
    <button className={cls} onClick={revealed ? undefined : onClick} disabled={revealed}>
      <span className="shrink-0 font-bold opacity-60 text-lg w-6">{label}.</span>
      <span className="leading-relaxed">{text}</span>
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

  const opts: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  }
  const revealed = result !== null

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold leading-relaxed">{question.question_text}</h3>

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
        <div className="flex items-center justify-center gap-2 text-sm text-primary py-4">
          <Loader2 className="h-5 w-5 animate-spin" /> <span>Sprawdzam odpowiedź…</span>
        </div>
      )}

      {revealed && result && (
        <div
          className={`rounded-xl p-5 border-l-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 ${result.is_correct ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-300" : "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300"}`}
        >
          <div className="flex items-center gap-2 font-bold text-lg mb-2">
            {result.is_correct ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
            {result.is_correct ? "Poprawna odpowiedź!" : `Błędna odpowiedź. Prawidłowa to: ${result.correct_answer}`}
          </div>
          {result.explanation && (
            <p className="text-sm opacity-90 leading-relaxed mt-2">{result.explanation}</p>
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
        <span className="text-muted-foreground font-medium text-lg">Ładuję sesję quizu…</span>
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
  const progressPercent = Math.round((answeredCount / questions.length) * 100)

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border shadow-sm bg-card">
      {/* Left: Source text with background */}
      <div className="lg:w-5/12 flex flex-col relative min-h-[30vh]">
        {/* Background image for the text area */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-10"
          style={{ backgroundImage: "url('/background.jpg')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/80 to-background/95" />
        
        <div className="relative z-10 flex flex-col h-full p-8">
          <div className="flex items-center gap-3 mb-6 opacity-80">
            <div className="bg-primary/20 p-2 rounded-xl text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Tekst źródłowy
            </h2>
          </div>
          
          <div
            ref={sourceRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-4 text-base leading-relaxed whitespace-pre-wrap scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent text-foreground/90 font-medium"
          >
            {quiz.source_text ?? (
              <span className="text-muted-foreground italic">
                Wróć do głównej strony gry, aby zobaczyć tekst.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quiz Area */}
      <div className="lg:w-7/12 flex flex-col min-h-0 bg-background relative border-l">
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black tracking-tight line-clamp-1">
              {quiz.title}
            </h2>
            <div className="text-xs font-bold bg-muted px-3 py-1 rounded-full text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              Część {currentQuestion + 1} z {questions.length} / {progressPercent}%
            </div>
          </div>
          
          <div className="h-2 w-full rounded-full bg-muted mt-4 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4">
          {q && (
            <QuestionCard
              question={q}
              existingAnswer={quiz.answers?.[q.id] as any}
              onAnswered={(done) => {
                if (done) {
                  setAllAnswered(true)
                } else if (currentQuestion < questions.length - 1) {
                  setTimeout(() => setCurrentQuestion((p) => p + 1), 1500)
                }
              }}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <div className="p-6 bg-muted/20 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
            disabled={currentQuestion === 0}
            className="text-muted-foreground hover:text-foreground font-semibold"
          >
            Poprzednie
          </Button>

          {allAnswered ? (
            <Button size="lg" className="gap-2 font-bold px-8 shadow-md" onClick={goToTraining}>
              Przejdź do treningu <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestion((p) => Math.max(questions.length - 1, p + 1))}
              disabled={currentQuestion === questions.length - 1}
              className="font-semibold"
            >
              Następne
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
