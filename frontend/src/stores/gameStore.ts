import { create } from "zustand"
import { persist } from "zustand/middleware"

type GamePhase = "quiz" | "training" | "boss" | "summary"

interface GameStore {
  currentGameId: string | null
  currentPhase: GamePhase
  readingProgress: number
  quizAnswers: Record<string, string>

  setGame: (gameId: string, phase: GamePhase) => void
  setPhase: (phase: GamePhase) => void
  setReadingProgress: (progress: number) => void
  saveQuizAnswer: (questionId: string, answer: string) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      currentGameId: null,
      currentPhase: "quiz",
      readingProgress: 0,
      quizAnswers: {},

      setGame: (gameId, phase) =>
        set({
          currentGameId: gameId,
          currentPhase: phase,
          readingProgress: 0,
          quizAnswers: {},
        }),

      setPhase: (phase) => set({ currentPhase: phase }),

      setReadingProgress: (progress) => set({ readingProgress: progress }),

      saveQuizAnswer: (questionId, answer) =>
        set((state) => ({
          quizAnswers: { ...state.quizAnswers, [questionId]: answer },
        })),

      resetGame: () =>
        set({
          currentGameId: null,
          currentPhase: "quiz",
          readingProgress: 0,
          quizAnswers: {},
        }),
    }),
    { name: "sensai-game-state" },
  ),
)
