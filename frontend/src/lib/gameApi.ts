import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL ?? ""

const api = axios.create({ baseURL: `${API_URL}/api/v1` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Types ──────────────────────────────────────────────────────────────────

export interface GameSummary {
  id: string
  title: string
  status: string | null
  reading_progress: number
  final_score: number | null
  created_at: string
  completed_at: string | null
}

export interface GameDetail extends GameSummary {
  source_text: string
  description: string | null
}

export interface QuizQuestionData {
  id: string
  order_index: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer?: string
  explanation?: string
  user_answer?: string
  is_correct?: boolean | null
}

export interface QuizData {
  game_id: string
  title: string
  status: string | null
  source_text: string
  questions: QuizQuestionData[]
  answers: Record<
    string,
    { selected_option: string; is_correct: boolean | null }
  >
}

export interface QuizAnswerResult {
  is_correct: boolean
  correct_answer: string
  explanation: string | null
  all_answered: boolean
}

export interface QuizResultsData {
  game_id: string
  title: string
  correct_count: number
  total_count: number
  questions: QuizQuestionData[]
}

export interface TrainingQuestionData {
  id: string
  order_index: number
  question_text: string
  difficulty: string
  user_answer: string | null
  score: number | null
  feedback: string | null
  ideal_answer: string | null
}

export interface TrainingData {
  session_id: string
  is_finished: boolean
  answered_count: number
  total_count: number
  questions: TrainingQuestionData[]
}

export interface BossTurn {
  question_id: string
  score: number
  damage: number
  combo: number
  boss_hp_after: number
}

export interface BossSimulationResult {
  turns: BossTurn[]
  boss_hp_start: number
  boss_hp_end: number
  player_damage_total: number
  accuracy_avg: number
  combo_count: number
  victory: boolean
  xp_gained: number
}

export interface LeaderboardEntry {
  id: string
  full_name: string | null
  email: string
  total_points: number
}

// ── API calls ──────────────────────────────────────────────────────────────

export const GamesApi = {
  createGame: (source_text: string) =>
    api.post<GameDetail & { questions: QuizQuestionData[] }>("/games/", { source_text }).then((r) => r.data),

  listGames: () =>
    api.get<GameSummary[]>("/games/").then((r) => r.data),

  getGame: (id: string) =>
    api.get<GameDetail>(`/games/${id}`).then((r) => r.data),

  updateProgress: (id: string, reading_progress: number) =>
    api.patch(`/games/${id}/progress`, { reading_progress }).then((r) => r.data),

  getQuiz: (id: string) =>
    api.get<QuizData>(`/games/${id}/quiz`).then((r) => r.data),

  submitQuizAnswer: (
    gameId: string,
    question_id: string,
    selected_option: string,
  ) =>
    api
      .post<QuizAnswerResult>(`/games/${gameId}/quiz/answer`, {
        question_id,
        selected_option,
      })
      .then((r) => r.data),

  getQuizResults: (id: string) =>
    api.get<QuizResultsData>(`/games/${id}/quiz/results`).then((r) => r.data),

  startTraining: (id: string) =>
    api
      .post<{ session_id: string; questions: TrainingQuestionData[] }>(
        `/games/${id}/training/start`,
      )
      .then((r) => r.data),

  getTraining: (id: string) =>
    api.get<TrainingData>(`/games/${id}/training`).then((r) => r.data),

  answerTraining: (gameId: string, questionId: string, answer: string) =>
    api
      .post<TrainingQuestionData>(
        `/games/${gameId}/training/${questionId}/answer`,
        { answer },
      )
      .then((r) => r.data),

  startBossBattle: (id: string) =>
    api.post<BossSimulationResult>(`/games/${id}/boss/start`).then((r) => r.data),

  getBossResult: (id: string) =>
    api.get<BossSimulationResult>(`/games/${id}/boss/result`).then((r) => r.data),

  getLeaderboard: () =>
    api.get<LeaderboardEntry[]>("/games/leaderboard").then((r) => r.data),
}
