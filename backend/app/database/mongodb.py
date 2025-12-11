from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

mongodb = MongoDB()

async def init_mongodb():
    """Initialize MongoDB connection"""
    mongodb.client = AsyncIOMotorClient(settings.mongodb_url)
    mongodb.db = mongodb.client[settings.mongodb_db]
    
    # Create indexes
    await mongodb.db.users.create_index("email", unique=True)
    await mongodb.db.users.create_index("team_id")
    await mongodb.db.call_reports.create_index("agent_id")
    await mongodb.db.call_reports.create_index("date")
    await mongodb.db.active_calls.create_index("agent_id")
    
    print("MongoDB connected and indexes created")

async def close_mongodb():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()

def get_mongodb() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance"""
    return mongodb.db
