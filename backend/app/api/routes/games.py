from __future__ import annotations

import uuid
from dataclasses import asdict
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.llm.boss_battle import BossSimulationResult, calculate_boss_hp, simulate_boss_battle
from app.llm.game_factory import create_game_with_mcq
from app.llm.training_factory import (
    answer_training_question,
    create_training_session_with_questions,
    finish_training_session,
    update_student_model_from_training,
)
from app.models import (
    BossBattle,
    Game,
    QuizAnswer,
    QuizQuestion,
    TrainingQuestion,
    TrainingSession,
    User,
    get_datetime_utc,
)

router = APIRouter(tags=["games"])


# ─── Request models ─────────────────────────────────────────────────────────

class GameCreateRequest(BaseModel):
    source_text: str
    title: str | None = None
    description: str | None = None
    difficulty: str = "medium"
    icon: str = "sparkles"


class ProgressUpdateRequest(BaseModel):
    reading_progress: int


class QuizAnswerRequest(BaseModel):
    question_id: uuid.UUID
    selected_option: str  # "A", "B", "C", "D"


class TrainingAnswerRequest(BaseModel):
    answer: str


# ─── Response helpers ────────────────────────────────────────────────────────

def _game_dict(game: Game) -> dict[str, Any]:
    return {
        "id": str(game.id),
        "title": game.title,
        "description": game.description,
        "status": game.status,
        "difficulty": game.difficulty,
        "icon": game.icon,
        "reading_progress": game.reading_progress,
        "final_score": game.final_score,
        "created_at": game.created_at,
        "completed_at": game.completed_at,
    }


def _game_detail_dict(game: Game) -> dict[str, Any]:
    d = _game_dict(game)
    d["source_text"] = game.source_text
    return d


def _question_dict(q: QuizQuestion, include_answer: bool = False) -> dict[str, Any]:
    d = {
        "id": str(q.id),
        "order_index": q.order_index,
        "question_text": q.question_text,
        "option_a": q.option_a,
        "option_b": q.option_b,
        "option_c": q.option_c,
        "option_d": q.option_d,
    }
    if include_answer:
        d["correct_answer"] = q.correct_answer
        d["explanation"] = q.explanation
    return d


def _training_question_dict(q: TrainingQuestion) -> dict[str, Any]:
    return {
        "id": str(q.id),
        "order_index": q.order_index,
        "question_text": q.question_text,
        "difficulty": q.difficulty,
        "user_answer": q.user_answer,
        "score": q.score,
        "feedback": q.feedback,
        "ideal_answer": q.ideal_answer if q.score is not None else None,
    }


def _get_game(session: SessionDep, game_id: uuid.UUID, current_user: User) -> Game:
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your game")
    return game


# ─── Leaderboard (must come before /{game_id} routes) ────────────────────────

@router.get("/leaderboard")
def get_leaderboard(session: SessionDep, _: CurrentUser) -> list[dict[str, Any]]:
    stmt = (
        select(User)
        .where(User.is_active == True)  # noqa: E712
        .order_by(col(User.total_points).desc())
        .limit(20)
    )
    users = session.exec(stmt).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "total_points": u.total_points,
        }
        for u in users
    ]


# ─── Game CRUD ───────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_game(
    body: GameCreateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    if len(body.source_text.strip()) < 80:
        raise HTTPException(status_code=422, detail="Source text is too short (min 80 chars)")
    game, questions = create_game_with_mcq(
        session=session,
        user_id=current_user.id,
        text=body.source_text,
        title=body.title,
        description=body.description,
        difficulty=body.difficulty,
        icon=body.icon,
    )
    result = _game_detail_dict(game)
    result["questions"] = [_question_dict(q) for q in questions]
    return result


@router.get("/")
def list_games(session: SessionDep, current_user: CurrentUser) -> list[dict[str, Any]]:
    stmt = (
        select(Game)
        .where(Game.user_id == current_user.id)
        .order_by(col(Game.created_at).desc())
    )
    games = session.exec(stmt).all()
    return [_game_dict(g) for g in games]


@router.get("/{game_id}")
def get_game(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)
    return _game_detail_dict(game)


@router.patch("/{game_id}/progress")
def update_progress(
    game_id: uuid.UUID,
    body: ProgressUpdateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)
    game.reading_progress = max(0, body.reading_progress)
    session.add(game)
    session.commit()
    session.refresh(game)
    return {"reading_progress": game.reading_progress}


# ─── Quiz ────────────────────────────────────────────────────────────────────

@router.get("/{game_id}/quiz")
def get_quiz(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)
    stmt = (
        select(QuizQuestion)
        .where(QuizQuestion.game_id == game_id)
        .order_by(col(QuizQuestion.order_index))
    )
    questions = session.exec(stmt).all()

    # Load existing answers for this user
    answers_stmt = select(QuizAnswer).where(
        QuizAnswer.game_id == game_id,
        QuizAnswer.user_id == current_user.id,
    )
    answers = {str(a.question_id): a for a in session.exec(answers_stmt).all()}

    return {
        "game_id": str(game_id),
        "title": game.title,
        "status": game.status,
        "source_text": game.source_text,
        "questions": [_question_dict(q) for q in questions],
        "answers": {
            qid: {
                "selected_option": a.selected_option,
                "is_correct": a.is_correct,
            }
            for qid, a in answers.items()
        },
    }


@router.post("/{game_id}/quiz/answer")
def submit_quiz_answer(
    game_id: uuid.UUID,
    body: QuizAnswerRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    _get_game(session, game_id, current_user)

    question = session.get(QuizQuestion, body.question_id)
    if not question or question.game_id != game_id:
        raise HTTPException(status_code=404, detail="Question not found")

    selected = body.selected_option.upper()
    if selected not in ("A", "B", "C", "D"):
        raise HTTPException(status_code=422, detail="Option must be A, B, C, or D")

    is_correct = selected == question.correct_answer.upper()

    # Upsert answer
    existing_stmt = select(QuizAnswer).where(
        QuizAnswer.question_id == body.question_id,
        QuizAnswer.user_id == current_user.id,
    )
    answer = session.exec(existing_stmt).first()
    if answer:
        answer.selected_option = selected
        answer.is_correct = is_correct
    else:
        answer = QuizAnswer(
            game_id=game_id,
            question_id=body.question_id,
            user_id=current_user.id,
            selected_option=selected,
            is_correct=is_correct,
            explanation=question.explanation,
        )
    session.add(answer)

    # Check if all questions answered → advance status
    total_stmt = select(func.count()).select_from(QuizQuestion).where(
        QuizQuestion.game_id == game_id
    )
    total = session.exec(total_stmt).one()

    answered_stmt = select(func.count()).select_from(QuizAnswer).where(
        QuizAnswer.game_id == game_id,
        QuizAnswer.user_id == current_user.id,
    )
    answered = session.exec(answered_stmt).one()

    game = session.get(Game, game_id)
    if game and answered >= total and game.status == "quiz_ready":
        game.status = "quiz_completed"
        session.add(game)

    session.commit()

    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "all_answered": answered >= total,
    }


@router.post("/{game_id}/quiz/reset")
def reset_quiz(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    _get_game(session, game_id, current_user)
    
    stmt = select(QuizAnswer).where(
        QuizAnswer.game_id == game_id,
        QuizAnswer.user_id == current_user.id
    )
    answers = session.exec(stmt).all()
    for a in answers:
        session.delete(a)
    
    game = session.get(Game, game_id)
    if game:
        game.status = "quiz_ready"
        session.add(game)
        
    session.commit()
    return {"message": "Quiz reset successfully"}


@router.get("/{game_id}/quiz/results")
def get_quiz_results(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)

    stmt = (
        select(QuizQuestion)
        .where(QuizQuestion.game_id == game_id)
        .order_by(col(QuizQuestion.order_index))
    )
    questions = session.exec(stmt).all()

    answers_stmt = select(QuizAnswer).where(
        QuizAnswer.game_id == game_id,
        QuizAnswer.user_id == current_user.id,
    )
    answers = {str(a.question_id): a for a in session.exec(answers_stmt).all()}

    correct_count = sum(1 for a in answers.values() if a.is_correct)

    def _enrich(q: QuizQuestion) -> dict[str, Any]:
        base = _question_dict(q, include_answer=True)
        ans = answers.get(str(q.id))
        base["user_answer"] = ans.selected_option if ans else None
        base["is_correct"] = ans.is_correct if ans else None
        return base

    return {
        "game_id": str(game_id),
        "title": game.title,
        "correct_count": correct_count,
        "total_count": len(questions),
        "questions": [_enrich(q) for q in questions],
    }


# ─── Training ────────────────────────────────────────────────────────────────

@router.post("/{game_id}/training/start", status_code=status.HTTP_201_CREATED)
def start_training(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)

    # Validate quiz results before allowing training
    answers_stmt = select(QuizAnswer).where(
        QuizAnswer.game_id == game_id,
        QuizAnswer.user_id == current_user.id,
    )
    answers = list(session.exec(answers_stmt).all())
    correct_count = sum(1 for a in answers if a.is_correct)

    questions_count_stmt = select(func.count()).select_from(QuizQuestion).where(
        QuizQuestion.game_id == game_id
    )
    total_questions = session.exec(questions_count_stmt).one()

    if correct_count < total_questions:
        # User must repeat the quiz. Delete answers to reset.
        for a in answers:
            session.delete(a)
        game.status = "quiz_ready"
        session.add(game)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Musisz mieć 100% poprawnych odpowiedzi ({total_questions}/{total_questions}), aby przejść dalej. Twój wynik: {correct_count}/{total_questions}. Spróbuj jeszcze raz!",
        )

    # Idempotent: return existing active session if present
    existing_stmt = (
        select(TrainingSession)
        .where(TrainingSession.game_id == game_id)
        .where(col(TrainingSession.ended_at).is_(None))
        .order_by(col(TrainingSession.order_index).desc())
    )
    existing = session.exec(existing_stmt).first()
    if existing:
        questions_stmt = (
            select(TrainingQuestion)
            .where(TrainingQuestion.session_id == existing.id)
            .order_by(col(TrainingQuestion.order_index))
        )
        questions = list(session.exec(questions_stmt).all())
        return {
            "session_id": str(existing.id),
            "questions": [_training_question_dict(q) for q in questions],
        }

    training_session, questions = create_training_session_with_questions(
        session=session,
        game=game,
        question_count=5,
        difficulty="mixed",
    )
    return {
        "session_id": str(training_session.id),
        "questions": [_training_question_dict(q) for q in questions],
    }


@router.get("/{game_id}/training")
def get_training(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    _get_game(session, game_id, current_user)

    sess_stmt = (
        select(TrainingSession)
        .where(TrainingSession.game_id == game_id)
        .order_by(col(TrainingSession.order_index).desc())
    )
    training_session = session.exec(sess_stmt).first()
    if not training_session:
        raise HTTPException(status_code=404, detail="No training session found. Start one first.")

    questions_stmt = (
        select(TrainingQuestion)
        .where(TrainingQuestion.session_id == training_session.id)
        .order_by(col(TrainingQuestion.order_index))
    )
    questions = list(session.exec(questions_stmt).all())

    answered = sum(1 for q in questions if q.score is not None)
    return {
        "session_id": str(training_session.id),
        "is_finished": training_session.ended_at is not None,
        "answered_count": answered,
        "total_count": len(questions),
        "questions": [_training_question_dict(q) for q in questions],
    }


@router.post("/{game_id}/training/{question_id}/answer")
def answer_training(
    game_id: uuid.UUID,
    question_id: uuid.UUID,
    body: TrainingAnswerRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)

    question = session.get(TrainingQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    training_session = session.get(TrainingSession, question.session_id)
    if not training_session or training_session.game_id != game_id:
        raise HTTPException(status_code=403, detail="Question not in this game")

    if len(body.answer.strip()) < 3:
        raise HTTPException(status_code=422, detail="Answer is too short")

    updated = answer_training_question(
        session=session,
        game=game,
        training_question=question,
        user_answer=body.answer,
    )

    # Check if all answered → finish session
    questions_stmt = select(TrainingQuestion).where(
        TrainingQuestion.session_id == training_session.id
    )
    all_questions = list(session.exec(questions_stmt).all())
    all_answered = all(q.score is not None for q in all_questions)

    if all_answered and training_session.ended_at is None:
        finish_training_session(session=session, training_session=training_session)
        update_student_model_from_training(
            session=session, game=game, training_session=training_session
        )
        game.status = "training_completed"
        session.add(game)
        session.commit()

    return _training_question_dict(updated)


# ─── Boss Fight ───────────────────────────────────────────────────────────────

@router.post("/{game_id}/boss/start")
def start_boss_battle(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    game = _get_game(session, game_id, current_user)

    # Get latest training session
    sess_stmt = (
        select(TrainingSession)
        .where(TrainingSession.game_id == game_id)
        .order_by(col(TrainingSession.order_index).desc())
    )
    training_session = session.exec(sess_stmt).first()
    if not training_session:
        raise HTTPException(status_code=400, detail="Complete training before boss fight")

    # Get or create boss battle (idempotent)
    existing_stmt = select(BossBattle).where(BossBattle.game_id == game_id)
    boss_battle = session.exec(existing_stmt).first()

    if not boss_battle:
        count_stmt = select(func.count()).select_from(TrainingQuestion).where(
            TrainingQuestion.session_id == training_session.id
        )
        q_count = session.exec(count_stmt).one()
        boss_hp = calculate_boss_hp(q_count)

        boss_battle = BossBattle(
            game_id=game_id,
            session_id=training_session.id,
            boss_hp_start=boss_hp,
            max_score=boss_hp,
            score=0,
        )
        session.add(boss_battle)
        session.commit()
        session.refresh(boss_battle)

    result: BossSimulationResult = simulate_boss_battle(
        session=session, boss_battle=boss_battle
    )

    # Update game status and award XP
    game.status = "completed"
    game.final_score = result.xp_gained
    game.completed_at = get_datetime_utc()
    session.add(game)

    current_user.total_points += result.xp_gained
    session.add(current_user)
    session.commit()

    return {
        "turns": [asdict(t) for t in result.turns],
        "boss_hp_start": result.boss_hp_start,
        "boss_hp_end": result.boss_hp_end,
        "player_damage_total": result.player_damage_total,
        "accuracy_avg": result.accuracy_avg,
        "combo_count": result.combo_count,
        "victory": result.victory,
        "xp_gained": result.xp_gained,
    }


@router.get("/{game_id}/boss/result")
def get_boss_result(
    game_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    _get_game(session, game_id, current_user)

    stmt = select(BossBattle).where(BossBattle.game_id == game_id)
    boss_battle = session.exec(stmt).first()
    if not boss_battle:
        raise HTTPException(status_code=404, detail="Boss battle not started yet")

    return {
        "boss_hp_start": boss_battle.boss_hp_start,
        "boss_hp_end": boss_battle.boss_hp_end,
        "player_damage_total": boss_battle.player_damage_total,
        "accuracy_avg": boss_battle.accuracy_avg,
        "victory": boss_battle.victory,
        "xp_gained": boss_battle.score,
        "completed_at": boss_battle.completed_at,
    }
