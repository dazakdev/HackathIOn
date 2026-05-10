from __future__ import annotations

import json
import re
from typing import Any, Literal

from google import genai
from google.genai import types
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from app.core.config import settings

AnswerKey = Literal["A", "B", "C", "D"]


class MCQAnswers(BaseModel):
    A: str
    B: str
    C: str
    D: str


class MCQQuestion(BaseModel):
    question: str
    answers: MCQAnswers
    correct_answer: AnswerKey
    explanation: str


class MCQQuiz(BaseModel):
    title: str = Field(min_length=3)
    questions: list[MCQQuestion] = Field(min_length=1)


class MCQState(TypedDict, total=False):
    text: str
    question_count: int
    raw_response: str
    quiz: MCQQuiz | None
    errors: list[str]
    attempts: int


def generate_mcq_quiz(text: str, question_count: int | None = None) -> MCQQuiz:
    graph = build_mcq_graph()
    result = graph.invoke(
        {
            "text": text,
            "question_count": question_count or settings.MCQ_QUESTIONS_PER_QUIZ,
            "errors": [],
            "attempts": 0,
        }
    )
    quiz = result.get("quiz")
    if quiz is None:
        errors = "; ".join(result.get("errors", []))
        raise ValueError(f"Could not generate a valid MCQ quiz: {errors}")
    return quiz


def build_mcq_graph():
    graph = StateGraph(MCQState)  # ty: ignore[invalid-argument-type]
    graph.add_node("normalize_input", normalize_input)
    graph.add_node("generate_mcq", generate_mcq)
    graph.add_node("validate_mcq", validate_mcq)
    graph.add_node("repair_mcq", repair_mcq)

    graph.set_entry_point("normalize_input")
    graph.add_edge("normalize_input", "generate_mcq")
    graph.add_edge("generate_mcq", "validate_mcq")
    graph.add_conditional_edges(
        "validate_mcq",
        should_retry_or_finish,
        {"repair": "repair_mcq", "finish": END},
    )
    graph.add_edge("repair_mcq", "validate_mcq")
    return graph.compile()


def normalize_input(state: MCQState) -> MCQState:
    text = re.sub(r"\s+", " ", state["text"]).strip()
    if len(text) < 80:
        raise ValueError("Text is too short to generate a useful quiz")

    question_count = max(1, min(int(state.get("question_count", 5)), 10))
    return {**state, "text": text, "question_count": question_count}


def generate_mcq(state: MCQState) -> MCQState:
    response = _generate_content(
        _generation_prompt(state["text"], state["question_count"]),
        question_count=state["question_count"],
    )
    return {**state, "raw_response": response}


def validate_mcq(state: MCQState) -> MCQState:
    try:
        payload = _extract_json_object(state["raw_response"])
        quiz = MCQQuiz.model_validate(payload)
        return {**state, "quiz": quiz}
    except Exception as exc:
        errors = [*state.get("errors", []), str(exc)]
        return {**state, "errors": errors, "quiz": None}


def repair_mcq(state: MCQState) -> MCQState:
    attempts = state.get("attempts", 0) + 1
    response = _generate_content(
        _repair_prompt(
            raw_response=state["raw_response"],
            errors=state.get("errors", []),
            question_count=state["question_count"],
        ),
        question_count=state["question_count"],
    )
    return {**state, "raw_response": response, "attempts": attempts}


def should_retry_or_finish(state: MCQState) -> Literal["repair", "finish"]:
    if state.get("quiz") is not None:
        return "finish"
    if state.get("attempts", 0) < settings.MCQ_MAX_REPAIR_ATTEMPTS:
        return "repair"
    return "finish"


def _generate_content(prompt: str, question_count: int = 5) -> str:
    if not settings.GEMINI_API_KEY:
        return _generate_stub_mcq(question_count)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=_system_prompt(),
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=MCQQuiz,
        ),
    )
    if not response.text:
        raise ValueError("Gemini returned an empty response")
    return response.text


def _generate_stub_mcq(question_count: int) -> str:
    questions = []
    for i in range(question_count):
        questions.append(
            {
                "question": f"To jest przykładowe pytanie nr {i+1} (Stub)",
                "answers": {
                    "A": "To jest poprawna odpowiedź",
                    "B": "To jest błędna odpowiedź 1",
                    "C": "To jest błędna odpowiedź 2",
                    "D": "To jest błędna odpowiedź 3",
                },
                "correct_answer": "A",
                "explanation": f"Wyjaśnienie dla pytania nr {i+1}. Ten quiz jest wygenerowany w trybie testowym, ponieważ nie podano klucza API Gemini.",
            }
        )

    stub_quiz = {
        "title": "Przykładowy Quiz (Mock)",
        "questions": questions,
    }
    return json.dumps(stub_quiz, ensure_ascii=False)


def _system_prompt() -> str:
    return (
        "Jestes generatorem quizow edukacyjnych dla aplikacji Sensai. "
        "Zwracasz wylacznie poprawny JSON, bez markdowna, komentarzy ani tekstu obok. "
        "Wszystkie pytania i odpowiedzi piszesz po polsku."
    )


def _generation_prompt(text: str, question_count: int) -> str:
    return f"""
Na podstawie calego ponizszego tekstu wygeneruj quiz ABCD.
Nie dziel tekstu na czesci.
Wygeneruj dokladnie {question_count} pytan.
Pytania maja sprawdzac zrozumienie najwazniejszych informacji z tekstu.
Kazde pytanie ma miec dokladnie cztery odpowiedzi: A, B, C, D.
Tylko jedna odpowiedz moze byc poprawna.
Nie uzywaj wiedzy spoza tekstu.

Zwroc JSON w takim ksztalcie:
{{
  "title": "krotki tytul tematu",
  "questions": [
    {{
      "question": "tresc pytania",
      "answers": {{
        "A": "odpowiedz A",
        "B": "odpowiedz B",
        "C": "odpowiedz C",
        "D": "odpowiedz D"
      }},
      "correct_answer": "A",
      "explanation": "krotkie jednozdaniowe wyjasnienie poprawnej odpowiedzi"
    }}
  ]
}}

TEKST:
{text}
""".strip()


def _repair_prompt(
    *, raw_response: str, errors: list[str], question_count: int
) -> str:
    return f"""
Popraw ponizsza odpowiedz tak, aby byla poprawnym JSON-em zgodnym ze schematem quizu.
Quiz musi zawierac dokladnie {question_count} pytan.
Kazde pytanie musi miec odpowiedzi A, B, C i D oraz jedno correct_answer: A, B, C albo D.
Zwroc wylacznie poprawiony JSON.

BLEDY WALIDACJI:
{json.dumps(errors, ensure_ascii=False)}

ODPOWIEDZ DO POPRAWY:
{raw_response}
""".strip()


def _extract_json_object(raw: str) -> dict[str, Any]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        parsed = json.loads(cleaned[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("LLM response must be a JSON object")
    return parsed
