import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronRight, Loader2, Send, Bot, User, Award, Info } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { GamesApi, type TrainingQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/games/$gameId/training")({
  component: TrainingPage,
  head: () => ({ meta: [{ title: "Trening - Sensai" }] }),
})

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-green-500 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  hard: "text-red-500 bg-red-500/10 border-red-500/20",
}

function ScoreIndicator({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-500 bg-green-500/10" : score >= 60 ? "text-yellow-500 bg-yellow-500/10" : score >= 40 ? "text-orange-500 bg-orange-500/10" : "text-red-500 bg-red-500/10"
  
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${color}`}>
      <Award className="h-3.5 w-3.5" />
      <span>{score}/100</span>
    </div>
  )
}

function ChatMessage({
  role,
  content,
  isSystem = false,
  children,
}: {
  role: "student" | "sensai" | "system"
  content?: string
  isSystem?: boolean
  children?: React.ReactNode
}) {
  const isStudent = role === "student"
  const isSensai = role === "sensai"

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-muted/50 border px-4 py-2 rounded-full text-xs text-muted-foreground max-w-[80%] text-center leading-relaxed">
          {children || content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-4 my-6 w-full animate-in fade-in slide-in-from-bottom-2 ${isSensai ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-full shadow-sm border-2 ${isStudent ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-primary/10 border-primary/20 text-primary"}`}>
        {isStudent ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
      </div>
      
      {/* Message Body */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isSensai ? "items-end" : "items-start"}`}>
        <div className={`text-xs font-semibold mb-1 opacity-70 ${isSensai ? "text-right" : "text-left"}`}>
          {isStudent ? "Uczeń" : "Sensai (Ty)"}
        </div>
        <div className={`relative px-5 py-3.5 shadow-sm leading-relaxed text-sm ${isSensai ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none" : "bg-card border rounded-2xl rounded-tl-none"}`}>
          {content}
          {children}
        </div>
      </div>
    </div>
  )
}

function TrainingPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()
  const setPhase = useGameStore((s) => s.setPhase)
  const queryClient = useQueryClient()
  
  const [questions, setQuestions] = useState<TrainingQuestionData[] | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { isLoading, data: training } = useQuery({
    queryKey: ["training", gameId],
    queryFn: async () => {
      try {
        return await GamesApi.getTraining(gameId)
      } catch {
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

  const displayQuestions = questions ?? training?.questions ?? []
  const answered = displayQuestions.filter((q) => q.score !== null).length
  const total = displayQuestions.length
  const allAnswered = total > 0 && answered >= total
  const currentQuestion = displayQuestions.find((q) => q.score === null)

  const { mutate: submitAnswer, isPending } = useMutation({
    mutationFn: (text: string) => {
      if (!currentQuestion) throw new Error("No active question")
      return GamesApi.answerTraining(gameId, currentQuestion.id, text)
    },
    onSuccess: (updated) => {
      setQuestions((prev) => {
        const base = prev ?? training?.questions ?? []
        return base.map((q) => (q.id === updated.id ? updated : q))
      })
      setCurrentAnswer("")
      toast.success(`Odpowiedź oceniona!`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Błąd oceny odpowiedzi")
    },
  })

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayQuestions, isPending])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium text-lg">Generuję pytania ucznia…</span>
      </div>
    )
  }

  const goToBoss = () => {
    setPhase("boss")
    queryClient.invalidateQueries({ queryKey: ["games"] })
    navigate({ to: "/games/$gameId/boss", params: { gameId } })
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col rounded-3xl overflow-hidden border bg-background shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">Trening Ucznia</h1>
            <p className="text-muted-foreground text-xs font-medium mt-1">
              {answered} z {total} pytań odpowiedziane
            </p>
          </div>
        </div>
        
        <div className="w-32 hidden sm:block">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: total > 0 ? `${(answered / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <ChatMessage role="system">
          Rozpoczęto sesję treningową. Uczeń zada Ci 10 pytań opartych na tekście źródłowym.
          Twoim zadaniem jako Sensai jest udzielenie jak najbardziej precyzyjnych i wyczerpujących odpowiedzi.
        </ChatMessage>

        {displayQuestions.map((q, idx) => {
          // If question is not reached yet (and not the current one), hide it
          if (q.score === null && q.id !== currentQuestion?.id) return null

          return (
            <div key={q.id} className="mb-8">
              {/* Student asks question */}
              <ChatMessage role="student">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                  <span>Pytanie {idx + 1}</span>
                  <span className={`px-1.5 py-0.5 rounded-sm border ${DIFFICULTY_COLOR[q.difficulty] ?? ""}`}>
                    {q.difficulty}
                  </span>
                </div>
                {q.question_text}
              </ChatMessage>

              {/* Sensai's answer */}
              {q.user_answer && (
                <ChatMessage role="sensai">
                  {q.user_answer}
                </ChatMessage>
              )}

              {/* System Feedback */}
              {q.score !== null && (
                <ChatMessage role="system">
                  <div className="flex flex-col gap-3 text-left w-full max-w-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Ocena modelu AI:</span>
                      <ScoreIndicator score={q.score} />
                    </div>
                    {q.feedback && (
                      <div className="text-xs text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3">
                        <span className="font-semibold block mb-1">Feedback:</span>
                        {q.feedback}
                      </div>
                    )}
                    {q.ideal_answer && (
                      <div className="text-xs text-foreground/80 leading-relaxed border-l-2 border-green-500/50 pl-3 mt-1">
                        <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 mb-1">
                          <Info className="h-3 w-3" /> Wzorcowa odpowiedź:
                        </span>
                        {q.ideal_answer}
                      </div>
                    )}
                  </div>
                </ChatMessage>
              )}
            </div>
          )
        })}

        {isPending && (
          <ChatMessage role="system">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Sensai analizuje Twoją odpowiedź...</span>
            </div>
          </ChatMessage>
        )}
        
        <div className="h-4" /> {/* Bottom padding element */}
      </div>

      {/* Input Area / Action Footer */}
      <div className="shrink-0 p-4 bg-card border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {allAnswered ? (
          <div className="flex flex-col items-center justify-center p-4">
            <p className="text-sm font-bold text-muted-foreground mb-4">Trening zakończony! Uczeń jest gotowy do walki.</p>
            <Button size="lg" className="w-full max-w-sm gap-2 font-bold h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30" onClick={goToBoss}>
              Walcz z Bossem <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          currentQuestion && (
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  className="w-full min-h-[60px] max-h-[160px] rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y scrollbar-thin"
                  placeholder="Napisz odpowiedź do ucznia..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (currentAnswer.trim().length >= 3 && !isPending) {
                        submitAnswer(currentAnswer.trim());
                      }
                    }
                  }}
                  disabled={isPending}
                />
              </div>
              <Button
                size="icon"
                className="h-12 w-12 shrink-0 rounded-2xl shadow-md transition-all disabled:opacity-50"
                disabled={isPending || currentAnswer.trim().length < 3}
                onClick={() => submitAnswer(currentAnswer.trim())}
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
