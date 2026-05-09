import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronRight, Loader2, Send } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { GamesApi, type TrainingQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/games/$gameId/training")({
  component: TrainingPage,
  head: () => ({ meta: [{ title: "Trening - Sensai" }] }),
})

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : score >= 40 ? "bg-orange-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Ocena</span>
        <span className="font-bold">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  gameId,
  onAnswered,
}: {
  question: TrainingQuestionData
  gameId: string
  onAnswered: (updated: TrainingQuestionData) => void
}) {
  const [answer, setAnswer] = useState(question.user_answer ?? "")
  const isAnswered = question.score !== null

  const { mutate, isPending } = useMutation({
    mutationFn: (text: string) =>
      GamesApi.answerTraining(gameId, question.id, text),
    onSuccess: (updated) => {
      onAnswered(updated)
      toast.success(`Ocena: ${updated.score}/100`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Błąd oceny odpowiedzi")
    },
  })

  return (
    <Card
      className={`transition-all ${isAnswered ? "border-primary/30" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">
            Pyt. {question.order_index + 1}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[question.difficulty] ?? "text-muted-foreground"}`}
          >
            {question.difficulty}
          </span>
        </div>
        <CardTitle className="text-sm font-medium leading-relaxed mt-1">
          {question.question_text}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y disabled:opacity-60"
          placeholder="Twoja odpowiedź jako Sensai…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isAnswered || isPending}
        />

        {!isAnswered && (
          <Button
            size="sm"
            className="gap-2"
            disabled={isPending || answer.trim().length < 3}
            onClick={() => mutate(answer.trim())}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Oceniam…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Wyślij odpowiedź
              </>
            )}
          </Button>
        )}

        {isAnswered && question.score !== null && (
          <div className="space-y-3 pt-1">
            <ScoreBar score={question.score} />
            {question.feedback && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-1">Informacja zwrotna:</p>
                {question.feedback}
              </div>
            )}
            {question.ideal_answer && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs leading-relaxed">
                <p className="font-semibold text-primary mb-1">Wzorcowa odpowiedź:</p>
                {question.ideal_answer}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrainingPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const setPhase = useGameStore((s) => s.setPhase)
  const queryClient = useQueryClient()
  const [questions, setQuestions] = useState<TrainingQuestionData[] | null>(null)

  const { isLoading, data: training } = useQuery({
    queryKey: ["training", gameId],
    queryFn: async () => {
      try {
        return await GamesApi.getTraining(gameId)
      } catch {
        // No session yet — start one
        const started = await GamesApi.startTraining(gameId)
        return {
          session_id: started.session_id,
          is_finished: false,
          answered_count: 0,
          total_count: started.questions.length,
          questions: started.questions,
        }
      }
    },
    staleTime: 0,
  })

  // Merge local answer updates into questions
  const displayQuestions = questions ?? training?.questions ?? []
  const answered = displayQuestions.filter((q) => q.score !== null).length
  const total = displayQuestions.length
  const allAnswered = total > 0 && answered >= total

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Generuję pytania treningowe…</span>
      </div>
    )
  }

  const handleAnswered = (updated: TrainingQuestionData) => {
    setQuestions((prev) => {
      const base = prev ?? training?.questions ?? []
      return base.map((q) => (q.id === updated.id ? updated : q))
    })
  }

  const goToBoss = () => {
    setPhase("boss")
    queryClient.invalidateQueries({ queryKey: ["games"] })
    navigate({ to: "/games/$gameId/boss", params: { gameId } })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trening Ucznia</h1>
          <p className="text-muted-foreground mt-1">
            Odpowiedz na pytania ucznia jako Sensai.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {answered}/{total}
          </p>
          <p className="text-xs text-muted-foreground">odpowiedzi</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: total > 0 ? `${(answered / total) * 100}%` : "0%" }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {displayQuestions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            gameId={gameId}
            onAnswered={handleAnswered}
          />
        ))}
      </div>

      {allAnswered && (
        <div className="sticky bottom-4 flex justify-center">
          <Button size="lg" className="gap-2 shadow-lg" onClick={goToBoss}>
            Walcz z Bossem <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
