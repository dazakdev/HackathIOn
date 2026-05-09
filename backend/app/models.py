from __future__ import annotations

import uuid
from datetime import datetime, timezone

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    username: str = Field(min_length=1, max_length=255)
    total_points: int = Field(default=0)
    is_active: bool = True
    is_superuser: bool = False


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    username: str | None = Field(default=None, min_length=1, max_length=255)
    total_points: int | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None
    is_superuser: bool | None = None


class UserUpdateMe(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, min_length=1, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    games: list["Game"] = Relationship(back_populates="user", cascade_delete=True)
    quiz_answers: list["QuizAnswer"] = Relationship(back_populates="user")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    __tablename__ = "item"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


class Game(SQLModel, table=True):
    __tablename__ = "games"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
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
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    completed_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    user: User | None = Relationship(back_populates="games")
    quiz_questions: list["QuizQuestion"] = Relationship(back_populates="game")
    quiz_answers: list["QuizAnswer"] = Relationship(back_populates="game")
    student_model: "StudentModel" | None = Relationship(back_populates="game")
    training_sessions: list["TrainingSession"] = Relationship(back_populates="game")
    boss_battle: "BossBattle" | None = Relationship(back_populates="game")


class QuizQuestion(SQLModel, table=True):
    __tablename__ = "quiz_questions"

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
    game: Game | None = Relationship(back_populates="quiz_questions")
    answers: list["QuizAnswer"] = Relationship(back_populates="question")


class QuizAnswer(SQLModel, table=True):
    __tablename__ = "quiz_answers"

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
        foreign_key="users.id",
        nullable=False,
        ondelete="CASCADE",
    )
    selected_option: str | None = None
    is_correct: bool | None = None
    answered_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    game: Game | None = Relationship(back_populates="quiz_answers")
    question: QuizQuestion | None = Relationship(back_populates="answers")
    user: User | None = Relationship(back_populates="quiz_answers")


class StudentModel(SQLModel, table=True):
    __tablename__ = "student_model"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
        unique=True,
    )
    madrosc: int = Field(default=0)
    doglebne_przygotowanie: int = Field(default=0)
    poprawnosc_wyjasnien: int = Field(default=0)
    spojnosc: int = Field(default=0)
    kompletnosc: int = Field(default=0)
    overall_level: int = Field(default=0)
    updated_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    game: Game | None = Relationship(back_populates="student_model")


class TrainingSession(SQLModel, table=True):
    __tablename__ = "training_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(
        foreign_key="games.id",
        nullable=False,
        ondelete="CASCADE",
    )
    order_index: int
    started_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    ended_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    game: Game | None = Relationship(back_populates="training_sessions")
    messages: list["TrainingMessage"] = Relationship(back_populates="session")
    boss_battle: "BossBattle" | None = Relationship(back_populates="session")


class TrainingMessage(SQLModel, table=True):
    __tablename__ = "training_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(
        foreign_key="training_sessions.id",
        nullable=False,
        ondelete="CASCADE",
    )
    role: str
    content: str
    order_index: int
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    session: TrainingSession | None = Relationship(back_populates="messages")


class BossBattle(SQLModel, table=True):
    __tablename__ = "boss_battles"

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
    score: int = Field(default=0)
    max_score: int
    completed_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    game: Game | None = Relationship(back_populates="boss_battle")
    session: TrainingSession | None = Relationship(back_populates="boss_battle")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


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
