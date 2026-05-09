from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from app.llm.training import (
    TrainingDifficulty,
    evaluate_sensei_answer,
    generate_student_questions,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Test Sensai training generation.")
    parser.add_argument("file", type=Path, help="Path to a UTF-8 text file.")
    parser.add_argument(
        "--questions",
        type=int,
        default=3,
        help="Number of student questions to generate.",
    )
    parser.add_argument(
        "--answer",
        default=None,
        help="Optional sensei answer to evaluate against the first generated question.",
    )
    parser.add_argument(
        "--difficulty",
        choices=["easy", "medium", "hard", "mixed"],
        default="mixed",
        help="Difficulty of generated student questions.",
    )
    args = parser.parse_args()

    text = args.file.read_text(encoding="utf-8")
    difficulty: TrainingDifficulty = args.difficulty
    question_set = generate_student_questions(
        text,
        question_count=args.questions,
        difficulty=difficulty,
    )
    output: dict[str, object] = {"question_set": question_set.model_dump()}

    if args.answer:
        first_question = question_set.questions[0]
        evaluation = evaluate_sensei_answer(
            source_text=text,
            question_text=first_question.question_text,
            ideal_answer=first_question.ideal_answer,
            user_answer=args.answer,
        )
        output["first_answer_evaluation"] = evaluation.model_dump()

    sys.stdout.write(json.dumps(output, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
