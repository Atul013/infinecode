from datetime import datetime
from sqlalchemy import Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    features: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Not Explored", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
