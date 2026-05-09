from __future__ import annotations

from dataclasses import dataclass

from sqlmodel import Session, col, select

from app.models import BossBattle, TrainingQuestion, get_datetime_utc

DIFFICULTY_MULTIPLIER: dict[str, float] = {"easy": 1.0, "medium": 1.5, "hard": 2.5}
BASE_DAMAGE = 10
BOSS_HP_BASE = 100


def calculate_boss_hp(question_count: int) -> int:
    return BOSS_HP_BASE + (question_count * 20)


def calculate_damage(score: int, difficulty: str, combo: int) -> int:
    precision = score / 100.0
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    combo_bonus = 1.0 + (min(combo, 5) * 0.1)
    return int(BASE_DAMAGE * precision * multiplier * combo_bonus)


@dataclass
class BossTurn:
    question_id: str
    score: int
    damage: int
    combo: int
    boss_hp_after: int


@dataclass
class BossSimulationResult:
    turns: list[BossTurn]
    boss_hp_start: int
    boss_hp_end: int
    player_damage_total: int
    accuracy_avg: float
    combo_count: int
    victory: bool
    xp_gained: int


def simulate_boss_battle(
    *, session: Session, boss_battle: BossBattle
) -> BossSimulationResult:
    stmt = (
        select(TrainingQuestion)
        .where(TrainingQuestion.session_id == boss_battle.session_id)
        .where(col(TrainingQuestion.score).isnot(None))
        .order_by(col(TrainingQuestion.order_index))
    )
    questions = list(session.exec(stmt).all())

    if not questions:
        raise ValueError("No scored training questions found for this boss battle")

    boss_hp_start = boss_battle.boss_hp_start
    boss_hp = boss_hp_start

    turns: list[BossTurn] = []
    combo = 0
    max_combo = 0
    total_damage = 0
    total_score = 0

    for q in questions:
        score = q.score or 0
        total_score += score

        if score >= 70:
            combo += 1
            max_combo = max(max_combo, combo)
        else:
            combo = 0

        damage = calculate_damage(score, q.difficulty, combo)
        total_damage += damage
        boss_hp = max(0, boss_hp - damage)

        turns.append(
            BossTurn(
                question_id=str(q.id),
                score=score,
                damage=damage,
                combo=combo,
                boss_hp_after=boss_hp,
            )
        )

    accuracy_avg = total_score / len(questions)
    victory = boss_hp <= 0
    success_rate = min(total_damage / boss_hp_start, 1.0) if boss_hp_start > 0 else 0.0
    xp_gained = int(success_rate * 100 * len(questions))

    boss_battle.boss_hp_end = boss_hp
    boss_battle.player_damage_total = total_damage
    boss_battle.accuracy_avg = round(accuracy_avg, 2)
    boss_battle.combo_count = max_combo
    boss_battle.victory = victory
    boss_battle.score = total_damage
    boss_battle.completed_at = get_datetime_utc()

    session.add(boss_battle)
    session.commit()
    session.refresh(boss_battle)

    return BossSimulationResult(
        turns=turns,
        boss_hp_start=boss_hp_start,
        boss_hp_end=boss_hp,
        player_damage_total=total_damage,
        accuracy_avg=round(accuracy_avg, 2),
        combo_count=max_combo,
        victory=victory,
        xp_gained=xp_gained,
    )
