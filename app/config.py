# config.py
import os
from dotenv import load_dotenv

load_dotenv()

MAX_BOT_TOKEN = os.getenv('MAX_BOT_TOKEN', 'f9LHodD0cOLFIACnTwZ_Nt923IHNAGT8Sa2OzJ_LNhEwHj6TaMoFSW4DK0-v3p99zTs3vgkRIofhLvtYgBH6')
WEB_APP_URL = "https://webtomax.vercel.app"