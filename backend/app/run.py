import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import Settings
import uvicorn

port = int(Settings.PORT)
host = Settings.HOST

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=host, port=port, reload=True) 