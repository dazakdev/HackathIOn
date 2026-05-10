from __future__ import annotations

from sqlmodel import Session, col, func, select

from app.llm.training import (
    TrainingDifficulty,
    evaluate_treneiro_answer,
    generate_student_questions,
)
from app.models import (
    Game,
    StudentModel,
    TrainingQuestion,
    TrainingSession,
    get_datetime_utc,
)


def create_training_session_with_questions(
    *,
    session: Session,
    game: Game,
    question_count: int = 3,
    difficulty: TrainingDifficulty = "mixed",
) -> tuple[TrainingSession, list[TrainingQuestion]]:
    question_set = generate_student_questions(
        game.source_text,
        question_count=question_count,
        difficulty=difficulty,
    )
    training_session = TrainingSession(
        game_id=game.id,
        order_index=_next_training_session_index(session=session, game=game),
    )
    session.add(training_session)
    session.flush()

    questions: list[TrainingQuestion] = []
    for index, generated_question in enumerate(question_set.questions):
        question = TrainingQuestion(
            session_id=training_session.id,
            question_text=generated_question.question_text,
            ideal_answer=generated_question.ideal_answer,
            difficulty=generated_question.difficulty,
            order_index=index,
        )
        session.add(question)
        questions.append(question)

    game.status = "training_ready"
    session.add(game)
    session.commit()
    session.refresh(training_session)
    for question in questions:
        session.refresh(question)

    return training_session, questions


def answer_training_question(
    *,
    session: Session,
    game: Game,
    training_question: TrainingQuestion,
    user_answer: str,
) -> TrainingQuestion:
    evaluation = evaluate_treneiro_answer(
        source_text=game.source_text,
        question_text=training_question.question_text,
        ideal_answer=training_question.ideal_answer,
        user_answer=user_answer,
    )
    training_question.user_answer = user_answer
    training_question.score = evaluation.score
    training_question.feedback = evaluation.feedback
    session.add(training_question)
    session.commit()
    session.refresh(training_question)
    return training_question


def update_student_model_from_training(
    *,
    session: Session,
    game: Game,
    training_session: TrainingSession,
) -> StudentModel:
    scores = [
        question.score
        for question in _training_questions(session=session, training_session=training_session)
        if question.score is not None
    ]
    if not scores:
        raise ValueError("Training session has no scored answers")

    overall_level = round(sum(scores) / len(scores))
    statement = select(StudentModel).where(StudentModel.game_id == game.id)
    student_model = session.exec(statement).first()
    if student_model is None:
        student_model = StudentModel(game_id=game.id)

    student_model.overall_level = overall_level
    student_model.updated_at = get_datetime_utc()
    session.add(student_model)
    session.commit()
    session.refresh(student_model)
    return student_model


def finish_training_session(
    *, session: Session, training_session: TrainingSession
) -> TrainingSession:
    training_session.ended_at = get_datetime_utc()
    session.add(training_session)
    session.commit()
    session.refresh(training_session)
    return training_session


def _next_training_session_index(*, session: Session, game: Game) -> int:
    statement = select(func.count()).select_from(TrainingSession).where(
        TrainingSession.game_id == game.id
    )
    return session.exec(statement).one()


def _training_questions(
    *, session: Session, training_session: TrainingSession
) -> list[TrainingQuestion]:
    statement = (
        select(TrainingQuestion)
        .where(TrainingQuestion.session_id == training_session.id)
        .order_by(col(TrainingQuestion.order_index))
    )
    return list(session.exec(statement).all())
