import logging
import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase


logger = logging.getLogger(__name__)


class MongoDB:
    def __init__(self) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self) -> None:
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
        db_name = os.getenv("MONGODB_DB_NAME", "sentinel_db")

        self._client = AsyncIOMotorClient(
            mongodb_uri,
            maxPoolSize=int(os.getenv("MONGODB_MAX_POOL_SIZE", "50")),
            minPoolSize=int(os.getenv("MONGODB_MIN_POOL_SIZE", "5")),
            serverSelectionTimeoutMS=int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "5000")),
        )
        self._db = self._client[db_name]

        await self._db.command("ping")
        await self._db.messages.create_index("timestamp")
        logger.info("MongoDB connected successfully")

    async def disconnect(self) -> None:
        if self._client is not None:
            self._client.close()
            logger.info("MongoDB connection closed")
        self._client = None
        self._db = None

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("Database has not been initialized")
        return self._db

    @property
    def messages_collection(self) -> AsyncIOMotorCollection:
        return self.db.messages

    @property
    def analytics_collection(self) -> AsyncIOMotorCollection:
        return self.db.analytics


mongodb = MongoDB()
