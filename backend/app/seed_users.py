import logging
import random
from sqlmodel import Session, select
from app import crud
from app.core.db import engine, init_db
from app.models import UserCreate, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NAMES = [
    "Adam Kowalski", "Anna Nowak", "Piotr Wiśniewski", "Maria Wójcik",
    "Łukasz Kowalczyk", "Katarzyna Kamińska", "Marcin Lewandowski",
    "Agnieszka Zielińska", "Tomasz Woźniak", "Małgorzata Szymańska"
]

def seed_users() -> None:
    with Session(engine) as session:
        # First, ensure superuser exists
        init_db(session)
        
        for i, name in enumerate(NAMES):
            email = f"user{i+1}@example.com"
            user = session.exec(select(User).where(User.email == email)).first()
            if not user:
                user_in = UserCreate(
                    email=email,
                    password="password123",
                    full_name=name,
                    total_points=random.randint(100, 5000)
                )
                crud.create_user(session=session, user_create=user_in)
                logger.info(f"Created user: {name} ({email})")
            else:
                logger.info(f"User {email} already exists")
        session.commit()

if __name__ == "__main__":
    seed_users()
