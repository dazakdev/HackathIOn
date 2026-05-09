import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronRight, Loader2, Send, Bot, User, Award, Info, X, Clock3 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { GamesApi, type TrainingQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/games/$gameId/training")({
  component: TrainingPage,
  head: () => ({ meta: [{ title: "Trening - Sensai" }] }),
})


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
        <div className="bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 max-w-[80%] text-center leading-relaxed">
          {children || content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-4 my-6 w-full ${isSensai ? "flex-row-reverse" : ""}`}>
      <div className="shrink-0 size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
        {isStudent ? <Bot className="h-4 w-4 text-white/70" /> : <User className="h-4 w-4 text-white/70" />}
      </div>
      <div className={`max-w-[70%] ${isSensai ? "text-right" : "text-left"}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 text-sm shadow-lg ${isSensai ? "bg-white text-black" : "bg-black/40 text-white"}`}>
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
    <div className="mx-auto max-w-[1200px] h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border border-white/10 bg-[#2f2f2f] shadow-[0_30px_80px_rgba(0,0,0,0.4)] flex flex-col">
      <div className="h-12 bg-[#3b3b3b] flex items-center px-6 text-xs text-white/80">
        <div className="flex items-center gap-2 font-semibold">
          <X className="h-4 w-4" /> Wprowadzenie do Stoicyzmu
        </div>
        <div className="flex-1 flex items-center justify-center gap-6">
          <span className="uppercase tracking-widest">Część {answered + 1} z {total}</span>
          <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-white" style={{ width: total > 0 ? `${(answered / total) * 100}%` : "0%" }} />
          </div>
          <span className="font-semibold">{Math.round((answered / Math.max(total, 1)) * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" /> 12:45
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 flex flex-col items-center justify-center gap-6 p-6">
          <button className="rounded-2xl bg-white text-black px-6 py-3 text-sm font-semibold shadow-lg">
            ALE SUPER!
          </button>
          <img src="/assets/images/student.gif" alt="Uczeń" className="w-40" />
        </aside>

        <div className="flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            {displayQuestions.map((q, idx) => {
              if (q.score === null && q.id !== currentQuestion?.id) return null

              return (
                <div key={q.id} className="mb-10">
                  <ChatMessage role="student">
                    <div className="mb-2 text-[11px] uppercase tracking-widest opacity-70">
                      Pytanie {idx + 1}
                    </div>
                    {q.question_text}
                  </ChatMessage>

                  {q.user_answer && (
                    <ChatMessage role="sensai">
                      {q.user_answer}
                    </ChatMessage>
                  )}

                  {q.score !== null && (
                    <ChatMessage role="system">
                      <div className="flex flex-col gap-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">Ocena modelu AI:</span>
                          <ScoreIndicator score={q.score} />
                        </div>
                        {q.feedback && (
                          <div className="text-xs text-white/70 leading-relaxed">
                            {q.feedback}
                          </div>
                        )}
                        {q.ideal_answer && (
                          <div className="text-xs text-white/70 leading-relaxed">
                            <span className="font-semibold text-white flex items-center gap-1 mb-1">
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sensai analizuje Twoją odpowiedź...</span>
                </div>
              </ChatMessage>
            )}
          </div>

          <div className="p-6 border-t border-white/10">
            {allAnswered ? (
              <div className="flex flex-col items-center justify-center p-4">
                <p className="text-sm font-semibold text-white/70 mb-4">Trening zakończony! Uczeń jest gotowy do walki.</p>
                <Button size="lg" className="w-full max-w-sm gap-2 font-bold h-12" onClick={goToBoss}>
                  Walcz z Bossem <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              currentQuestion && (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      className="w-full min-h-[60px] rounded-2xl border border-white/10 bg-[#3b3b3b] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
                      placeholder="Wyjaśnij swojemu uczniowi..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          if (currentAnswer.trim().length >= 3 && !isPending) {
                            submitAnswer(currentAnswer.trim())
                          }
                        }
                      }}
                      disabled={isPending}
                    />
                    <div className="flex items-center justify-between text-[11px] text-white/40 mt-2">
                      <span>Wskazówka: Użyj analogii z życia codziennego.</span>
                      <span>Press Enter to send</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    className="h-11 w-11 rounded-full bg-black text-white"
                    disabled={isPending || currentAnswer.trim().length < 3}
                    onClick={() => submitAnswer(currentAnswer.trim())}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
