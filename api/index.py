import sys
from pathlib import Path

# Add project root and backend/ to Python path
# On Vercel: /var/task/api/index.py → root is parent.parent
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "backend"))

from dotenv import load_dotenv
load_dotenv()

from app.main import app
