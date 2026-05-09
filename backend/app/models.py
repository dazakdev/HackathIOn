import uuid
from datetime import datetime, timezone
from typing import Any, Optional, cast

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

SA_UTC_DATETIME: type[Any] = cast(type[Any], DateTime(timezone=True))


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    total_points: int = Field(default=0)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)
    total_points: int | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=SA_UTC_DATETIME,
    )
    games: list["Game"] = Relationship(back_populates="user", cascade_delete=True)
    quiz_answers: list["QuizAnswer"] = Relationship(back_populates="user")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class Game(SQLModel, table=True):
    __tablename__ = "games"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id",
        nullable=False,
        ondelete="CASCADE",
    )
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    source_text: str
    reading_progress: int = Field(default=0)
    status: str | None = None
    final_score: int | None = None
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=SA_UTC_DATETIME,
    )
    completed_at: datetime | None = Field(default=None, sa_type=SA_UTC_DATETIME)
    user: User | None = Relationship(back_populates="games")
    quiz_questions: list["QuizQuestion"] = Relationship(back_populates="game")
    quiz_answers: list["QuizAnswer"] = Relationship(back_populates="game")
    student_model: Optional["StudentModel"] = Relationship(back_populates="game")
    training_sessions: list["TrainingSession"] = Relationship(back_populates="game")
    boss_battle: Optional["BossBattle"] = Relationship(back_populates="game")


class QuizQuestion(SQLModel, table=True):
    __tablename__ = "quiz_questions"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
    )
    order_index: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str | None = None
    game: Game | None = Relationship(back_populates="quiz_questions")
    answers: list["QuizAnswer"] = Relationship(back_populates="question")


class QuizAnswer(SQLModel, table=True):
    __tablename__ = "quiz_answers"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
    )
    question_id: uuid.UUID = Field(
        foreign_key="quiz_questions.id",
        nullable=False,
        ondelete="CASCADE",
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id",
        nullable=False,
        ondelete="CASCADE",
    )
    selected_option: str | None = None
    is_correct: bool | None = None
    explanation: str | None = None
    answered_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=SA_UTC_DATETIME,
    )
    game: Game | None = Relationship(back_populates="quiz_answers")
    question: QuizQuestion | None = Relationship(back_populates="answers")
    user: User | None = Relationship(back_populates="quiz_answers")


class StudentModel(SQLModel, table=True):
    __tablename__ = "student_model"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
        unique=True,
    )
    overall_level: int = Field(default=0)
    updated_at: datetime | None = Field(default=None, sa_type=SA_UTC_DATETIME)
    game: Game | None = Relationship(back_populates="student_model")


class TrainingSession(SQLModel, table=True):
    __tablename__ = "training_sessions"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
    )
    order_index: int
    started_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=SA_UTC_DATETIME,
    )
    ended_at: datetime | None = Field(default=None, sa_type=SA_UTC_DATETIME)
    game: Game | None = Relationship(back_populates="training_sessions")
    questions: list["TrainingQuestion"] = Relationship(back_populates="session")
    boss_battle: Optional["BossBattle"] = Relationship(back_populates="session")


class TrainingQuestion(SQLModel, table=True):
    __tablename__ = "training_questions"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(
        foreign_key="training_sessions.id",
        nullable=False,
        ondelete="CASCADE",
    )
    question_text: str
    ideal_answer: str
    user_answer: str | None = None
    score: int | None = None
    feedback: str | None = None
    difficulty: str
    order_index: int
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=SA_UTC_DATETIME,
    )
    session: TrainingSession | None = Relationship(back_populates="questions")


class Boss(SQLModel, table=True):
    __tablename__ = "bosses"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(min_length=1, max_length=255)
    battles: list["BossBattle"] = Relationship(back_populates="boss")


class BossBattle(SQLModel, table=True):
    __tablename__ = "boss_battles"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
        unique=True,
    )
    session_id: uuid.UUID = Field(
        foreign_key="training_sessions.id",
        nullable=False,
        ondelete="CASCADE",
        unique=True,
    )
    boss_id: uuid.UUID | None = Field(
        foreign_key="bosses.id",
        nullable=True,
        ondelete="SET NULL",
    )
    score: int = Field(default=0)
    max_score: int
    completed_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=SA_UTC_DATETIME,
    )
    game: Game | None = Relationship(back_populates="boss_battle")
    session: TrainingSession | None = Relationship(back_populates="boss_battle")
    boss: Boss | None = Relationship(back_populates="battles")


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
