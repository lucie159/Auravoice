from app.config import settings

async def init_database():
    """Initialize the appropriate database based on configuration"""
    if settings.database_type == "postgresql":
        from app.database.postgres import init_postgres
        await init_postgres()
    else:
        from app.database.mongodb import init_mongodb
        await init_mongodb()

async def close_database():
    """Close database connections"""
    if settings.database_type == "mongodb":
        from app.database.mongodb import close_mongodb
        await close_mongodb()
