import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronRight, Loader2, Send, Bot, User, Award, Info, X, Clock3, BookOpen, Sun, Moon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { GamesApi, type TrainingQuestionData } from "@/lib/gameApi"
import { useGameStore } from "@/stores/gameStore"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Common/Logo"
import { useTheme } from "@/components/theme-provider"

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
        <div className="bg-muted border border-border px-4 py-2 rounded-md text-xs text-muted-foreground max-w-[80%] text-center leading-relaxed">
          {children || content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-4 my-6 w-full ${isSensai ? "flex-row-reverse" : ""}`}>
      <div className={`shrink-0 size-10 rounded-md flex items-center justify-center ${isStudent ? "bg-muted border border-border" : "bg-primary border border-primary/20"}`}>
        {isStudent ? <Bot className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-primary-foreground" />}
      </div>
      <div className={`max-w-[70%] ${isSensai ? "text-right" : "text-left"}`}>
        <div className={`inline-block rounded-lg px-4 py-3 text-sm shadow-xl ${isSensai ? "bg-card text-card-foreground border border-border" : "bg-muted/50 border border-border text-foreground"}`}>
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
  const { resolvedTheme, setTheme } = useTheme()

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayQuestions, isPending])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium text-lg">Przygotowuję sesję treningową…</span>
      </div>
    )
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const goToBoss = () => {
    setPhase("boss")
    queryClient.invalidateQueries({ queryKey: ["games"] })
    navigate({ to: "/games/$gameId/boss", params: { gameId } })
  }

  return (
    <div className="fixed inset-0 bg-background flex overflow-hidden">
      {/* Sidebar - left navigation and character */}
      <aside className="w-[340px] border-r border-border flex flex-col items-center py-10 px-8 bg-card/30">
        <div className="mb-12 flex flex-col items-center gap-2">
          <Logo variant="icon" className="h-16 w-auto" asLink={true} />
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">
            Przygotuj ucznia do walki
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-10">
          <div className="relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-bold shadow-2xl animate-bounce">
              ALE SUPER!
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-primary" />
            </div>
            <img src="/assets/images/student.gif" alt="Uczeń" className="w-56 drop-shadow-[0_0_30px_var(--color-primary)]" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-foreground font-bold">Twój Uczeń</h3>
            <p className="text-muted-foreground text-xs px-4">Wyjaśniaj pojęcia prosto i obrazowo, aby uczeń mógł pokonać bossa!</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => navigate({ to: "/" })}
        >
          <X className="mr-2 h-4 w-4" /> Przerwij trening
        </Button>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col bg-background relative">
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center px-10 justify-between bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-foreground leading-tight">Wprowadzenie do Stoicyzmu</h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Faza 2: Trening Ucznia</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center justify-between w-48 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                <span>Postęp</span>
                <span>{Math.round((answered / Math.max(total, 1)) * 100)}%</span>
              </div>
              <div className="w-48 h-2 rounded-full bg-muted overflow-hidden border border-border">
                <div className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-700" style={{ width: total > 0 ? `${(answered / total) * 100}%` : "0%" }} />
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="size-10 rounded-lg border border-border bg-card flex items-center justify-center transition-all hover:bg-muted"
                title="Zmień motyw"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4.5 w-4.5 text-yellow-400" /> : <Moon className="h-4.5 w-4.5 text-primary" />}
              </button>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-card border border-border">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground font-mono tracking-wider">12:45</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-4 scroll-smooth z-0">
          {displayQuestions.map((q, idx) => {
            if (q.score === null && q.id !== currentQuestion?.id) return null

            return (
              <div key={q.id} className="mb-12">
                <ChatMessage role="student">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Pytanie od ucznia {idx + 1}
                  </div>
                  <p className="text-base leading-relaxed">{q.question_text}</p>
                </ChatMessage>

                {q.user_answer && (
                  <ChatMessage role="sensai">
                    <p className="text-base leading-relaxed">{q.user_answer}</p>
                  </ChatMessage>
                )}


              </div>
            )
          })}

          {isPending && (
            <ChatMessage role="system">
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium text-muted-foreground">Uczeń analizuje Twoje słowa...</span>
              </div>
            </ChatMessage>
          )}
        </div>

        {/* Bottom input section */}
        <footer className="p-8 border-t border-border bg-background/80 backdrop-blur-lg z-10">
          {allAnswered ? (
            <div className="flex flex-col items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="size-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-4">
                <Award className="h-6 w-6" />
              </div>
              <p className="text-lg font-bold text-foreground mb-6">Twój uczeń jest gotowy do wielkiego starcia!</p>
              <Button size="lg" className="w-full max-w-sm gap-3 font-bold h-14 text-lg shadow-xl" onClick={goToBoss}>
                Rozpocznij walkę z Bossem <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            currentQuestion && (
              <div className="flex items-end gap-4 max-w-4xl mx-auto">
                <div className="flex-1 relative group">
                  <textarea
                    className="w-full min-h-[80px] max-h-[200px] rounded-xl border border-border bg-card px-6 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none shadow-2xl"
                    placeholder="Wpisz swoje wyjaśnienie tutaj..."
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
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-3 font-bold uppercase tracking-widest px-1">
                    <span className="flex items-center gap-1.5"><Info className="h-3 w-3" /> Press Enter to send explanation</span>
                    <span>{currentAnswer.length} chars</span>
                  </div>
                </div>
                <Button
                  size="icon"
                  className={`h-14 w-14 rounded-xl shadow-2xl transition-all duration-300 ${currentAnswer.trim().length >= 3 ? "bg-primary text-primary-foreground scale-100" : "bg-muted text-muted-foreground scale-95"}`}
                  disabled={isPending || currentAnswer.trim().length < 3}
                  onClick={() => submitAnswer(currentAnswer.trim())}
                >
                  {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                </Button>
              </div>
            )
          )}
        </footer>
      </main>
    </div>
  )
}
