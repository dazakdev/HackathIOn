from __future__ import annotations

import uuid

from sqlmodel import Session

from app.llm.mcq import generate_mcq_quiz
from app.models import Game, QuizQuestion


def create_game_with_mcq(
    *,
    session: Session,
    user_id: uuid.UUID,
    text: str,
    question_count: int | None = None,
    title: str | None = None,
    description: str | None = None,
) -> tuple[Game, list[QuizQuestion]]:
    quiz = generate_mcq_quiz(text, question_count=question_count)
    game = Game(
        user_id=user_id,
        title=title or quiz.title,
        description=description,
        source_text=text,
        reading_progress=0,
        status="quiz_ready",
    )
    session.add(game)
    session.flush()

    questions: list[QuizQuestion] = []
    for index, question in enumerate(quiz.questions):
        db_question = QuizQuestion(
            game_id=game.id,
            order_index=index,
            question_text=question.question,
            option_a=question.answers.A,
            option_b=question.answers.B,
            option_c=question.answers.C,
            option_d=question.answers.D,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
        )
        session.add(db_question)
        questions.append(db_question)

    session.commit()
    session.refresh(game)
    for question in questions:
        session.refresh(question)

    return game, questions
