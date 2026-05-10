from __future__ import annotations

import json
import re
from typing import Any, Literal, cast

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, field_validator

from app.core.config import settings

TrainingDifficulty = Literal["easy", "medium", "hard", "mixed"]


class GeneratedTrainingQuestion(BaseModel):
    question_text: str
    ideal_answer: str
    difficulty: str

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        normalized = value.lower().strip()
        if normalized not in {"easy", "medium", "hard"}:
            return "medium"
        return normalized


class GeneratedTrainingQuestions(BaseModel):
    title: str = Field(min_length=3)
    questions: list[GeneratedTrainingQuestion] = Field(min_length=1)


class TreneiroAnswerEvaluation(BaseModel):
    score: int
    feedback: str

    @field_validator("score")
    @classmethod
    def clamp_score(cls, value: int) -> int:
        return max(0, min(value, 100))


def generate_student_questions(
    source_text: str,
    question_count: int = 3,
    difficulty: TrainingDifficulty = "mixed",
) -> GeneratedTrainingQuestions:
    text = _normalize_source_text(source_text)
    count = max(1, min(question_count, 10))
    selected_difficulty = _normalize_training_difficulty(difficulty)
    response = _generate_content(
        prompt=_questions_prompt(text, count, selected_difficulty),
        response_schema=GeneratedTrainingQuestions,
        question_count=count,
    )
    return GeneratedTrainingQuestions.model_validate(_extract_json_object(response))


def evaluate_treneiro_answer(
    *,
    source_text: str,
    question_text: str,
    ideal_answer: str,
    user_answer: str,
) -> TreneiroAnswerEvaluation:
    text = _normalize_source_text(source_text)
    answer = user_answer.strip()
    if len(answer) < 3:
        raise ValueError("User answer is too short to evaluate")

    response = _generate_content(
        prompt=_evaluation_prompt(
            source_text=text,
            question_text=question_text,
            ideal_answer=ideal_answer,
            user_answer=answer,
        ),
        response_schema=TreneiroAnswerEvaluation,
    )
    return TreneiroAnswerEvaluation.model_validate(_extract_json_object(response))


def _normalize_source_text(source_text: str) -> str:
    text = re.sub(r"\s+", " ", source_text).strip()
    if len(text) < 80:
        raise ValueError("Source text is too short for training")
    return text


def _normalize_training_difficulty(difficulty: str) -> TrainingDifficulty:
    normalized = difficulty.lower().strip()
    if normalized in {"easy", "medium", "hard", "mixed"}:
        return cast(TrainingDifficulty, normalized)
    raise ValueError("Training difficulty must be easy, medium, hard or mixed")


def _generate_content(
    *,
    prompt: str,
    response_schema: type[BaseModel],
    question_count: int = 3,
) -> str:
    if not settings.GEMINI_API_KEY:
        if response_schema == GeneratedTrainingQuestions:
            return _generate_stub_training(question_count)
        if response_schema == TreneiroAnswerEvaluation:
            return _generate_stub_evaluation()
        raise ValueError(f"No stub implemented for {response_schema}")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=_system_prompt(),
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=response_schema,
        ),
    )
    if not response.text:
        raise ValueError("Gemini returned an empty response")
    return response.text


def _generate_stub_training(question_count: int) -> str:
    questions = []
    for i in range(question_count):
        questions.append(
            {
                "question_text": f"Przykładowe pytanie od ucznia nr {i + 1} (Stub)",
                "ideal_answer": f"To jest wzorcowa odpowiedź na pytanie nr {i + 1}. (Tryb Mock)",
                "difficulty": "medium",
            }
        )

    stub_training = {
        "title": "Przykładowy Trening (Mock)",
        "questions": questions,
    }
    return json.dumps(stub_training, ensure_ascii=False)


def _generate_stub_evaluation() -> str:
    stub_eval = {
        "score": 85,
        "feedback": "Twoja odpowiedź jest bardzo dobra! (To jest ocena w trybie testowym, ponieważ nie podano klucza API Gemini).",
    }
    return json.dumps(stub_eval, ensure_ascii=False)


def _system_prompt() -> str:
    return (
        "Jestes symulatorem ucznia w aplikacji Treneiro. "
        "Twoim celem jest stworzyc wiarygodna sytuacje nauki: uczen probuje zrozumiec temat, "
        "zadaje pytania tak, jak zrobilaby to prawdziwa osoba uczaca sie z tekstu, "
        "czasem myli pojecia, prosi o przyklad, dopytuje o przyczyne, skutek albo roznice "
        "miedzy podobnymi elementami. "
        "Pytania maja pomagac sprawdzic, czy treneiro potrafi uczyc jasno, cierpliwie i poprawnie, "
        "a nie tylko odtworzyc definicje. "
        "Nie zdradzaj odpowiedzi w tresci pytania. "
        "Korzystaj wylacznie z informacji z tekstu zrodlowego. "
        "Zwracasz wylacznie poprawny JSON, bez markdowna i komentarzy. "
        "Wszystkie tresci piszesz naturalna polszczyzna."
    )


def _questions_prompt(
    source_text: str, question_count: int, difficulty: TrainingDifficulty
) -> str:
    difficulty_instruction = _difficulty_instruction(difficulty)
    return f"""
Na podstawie tekstu wygeneruj dokladnie {question_count} pytan ucznia do treneiroa.
To ma byc symulacja prawdziwej nauki, nie zwykly quiz.

Uczen:
- chce zrozumiec temat, a nie tylko zdac test,
- pyta naturalnie, prostym jezykiem,
- czasem ujawnia czesciowe zrozumienie albo typowe nieporozumienie,
- prosi o wyjasnienie zaleznosci, przykladu, sensu albo konsekwencji,
- zadaje pytania, na ktore dobry treneiro powinien odpowiedziec jasno i dydaktycznie.

Ustawienie trudnosci:
{difficulty_instruction}

Kazde pytanie musi:
- wynikac bezposrednio z tekstu,
- byc sformulowane z perspektywy ucznia,
- nie zawierac gotowej odpowiedzi,
- sprawdzac, czy treneiro umie wytlumaczyc temat drugiej osobie.

Do kazdego pytania dodaj ideal_answer: wzorowa odpowiedz treneiroa.
Idealna odpowiedz powinna:
- byc poprawna na podstawie tekstu,
- byc krotka, ale dydaktyczna,
- tlumaczyc sens, nie tylko podawac haslo,
- odpowiadac tonem pomocnego nauczyciela.

Difficulty ustaw jako jedno z: easy, medium, hard.
Nie uzywaj wiedzy spoza tekstu.

Zwroc JSON:
{{
  "title": "krotki tytul treningu",
  "questions": [
    {{
      "question_text": "pytanie ucznia",
      "ideal_answer": "wzorowa odpowiedz treneiroa",
      "difficulty": "medium"
    }}
  ]
}}

TEKST:
{source_text}
""".strip()


def _difficulty_instruction(difficulty: TrainingDifficulty) -> str:
    if difficulty == "easy":
        return (
            "Wszystkie pytania maja miec difficulty=easy. "
            "Pytania powinny dotyczyc podstawowych pojec, faktow i najprostszych zaleznosci."
        )
    if difficulty == "medium":
        return (
            "Wszystkie pytania maja miec difficulty=medium. "
            "Pytania powinny wymagac wyjasnienia zaleznosci, mechanizmow, roznic lub przyczyn."
        )
    if difficulty == "hard":
        return (
            "Wszystkie pytania maja miec difficulty=hard. "
            "Pytania powinny wymagac polaczenia kilku informacji z tekstu i glebszego wyjasnienia."
        )
    return (
        "Wygeneruj mieszanke pytan easy, medium i hard. "
        "Easy dotyczy podstaw, medium zaleznosci i przyczyn, a hard laczenia kilku informacji z tekstu."
    )


def _evaluation_prompt(
    *,
    source_text: str,
    question_text: str,
    ideal_answer: str,
    user_answer: str,
) -> str:
    return f"""
Ocen odpowiedz uzytkownika jako treneiroa w skali 0-100.
Oceniaj na podstawie tekstu zrodlowego oraz odpowiedzi wzorcowej.

Zasady oceniania:
- Badz SZCZODRY w wystawianiu punktow.
- Nagradzaj zrozumienie istoty rzeczy, nawet jesli uzytkownik uzywa potocznego jezyka lub pominal detale.
- Nie wymagaj identycznego brzmienia z odpowiedzia wzorcowa.
- Jesli odpowiedz jest merytorycznie poprawna, celuj w zakres 85-100 punktow.
- Jesli odpowiedz jest czesciowo poprawna, daj co najmniej 60-70 punktow.

Skala:
0-29: odpowiedz zupelnie bledna lub brak odpowiedzi
30-59: uzytkownik cos wie, ale popelnil powazny blad merytoryczny
60-84: dobra odpowiedz, zawiera drobne braki lub niedokladnosci
85-100: swietna odpowiedz, uzytkownik rozumie temat

Zwroc JSON:
{{
  "score": 95,
  "feedback": "Bardzo dobre wyjasnienie! Swietnie uchwyciles sedno sprawy."
}}

TEKST ZRODLOWY:
{source_text}

PYTANIE UCZNIA:
{question_text}

ODPOWIEDZ WZORCOWA:
{ideal_answer}

ODPOWIEDZ UZYTKOWNIKA:
{user_answer}
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
        raise ValueError("Gemini response must be a JSON object")
    return parsed
