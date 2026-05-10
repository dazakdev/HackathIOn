from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from app.llm.mcq import generate_mcq_quiz


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Treneiro MCQ quiz with Ollama.")
    parser.add_argument("file", type=Path, help="Path to a UTF-8 text file.")
    parser.add_argument(
        "--questions",
        type=int,
        default=None,
        help="Number of ABCD questions to generate.",
    )
    args = parser.parse_args()

    text = args.file.read_text(encoding="utf-8")
    quiz = generate_mcq_quiz(text, question_count=args.questions)
    sys.stdout.write(json.dumps(quiz.model_dump(), ensure_ascii=False, indent=2))
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
