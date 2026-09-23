"""`uv run python -m app.worker`"""
import asyncio

from app.worker.runner import main

asyncio.run(main())
