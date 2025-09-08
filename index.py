import os
import logging
import asyncio
import json
from datetime import datetime
import aiohttp
from aiogram import Bot, Dispatcher, F, types
from aiogram.enums import ParseMode
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

# --- LOAD ENV ---
load_dotenv(".env")
BOT_TOKEN = os.getenv("BOT_TOKEN")
OWNER_ID = int(os.getenv("OWNER_ID", "0"))
OWNER_NAME = os.getenv("OWNER_NAME", "CYBIX DEV")
VERSION = "1.0.0"
BANNER_URL = "https://files.catbox.moe/7dozqn.jpg"
TG_CHANNEL = "cybixtech"
TG_CHANNEL_LINK = "https://t.me/cybixtech"
WA_CHANNEL = "https://whatsapp.com/channel/0029VbB8svo65yD8WDtzwd0X"
DEFAULT_PREFIXES = [".", "/"]
USERS_FILE = "users.json"
CHATS_FILE = "chats.json"

START_TIME = datetime.utcnow()
PREFIXES = DEFAULT_PREFIXES[:]
PLUGINS = [
    "ai_menu", "dl_menu", "other_menu", "fun_menu", "dev_menu"
]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cybix-bot")

# --- USERS/CHATS TRACKING ---
def load_json_set(fname):
    try:
        with open(fname, "r") as f:
            return set(json.load(f))
    except:
        return set()
def save_json_set(fname, s):
    with open(fname, "w") as f:
        json.dump(list(s), f)

USERS = load_json_set(USERS_FILE)
CHATS = load_json_set(CHATS_FILE)

def add_user(uid):
    USERS.add(uid)
    save_json_set(USERS_FILE, USERS)
def add_chat(cid):
    CHATS.add(cid)
    save_json_set(CHATS_FILE, CHATS)

# --- UTILS ---
def uptime_str():
    delta = datetime.utcnow() - START_TIME
    hours, remainder = divmod(int(delta.total_seconds()), 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours}h {minutes}m {seconds}s"
def now_time():
    return datetime.now().strftime("%H:%M:%S")
def now_date():
    return datetime.now().strftime("%Y-%m-%d")
def get_memory():
    try:
        import psutil
        process = psutil.Process()
        mem = process.memory_info().rss / 1024 / 1024
        return f"{mem:.2f}MB"
    except Exception:
        return "N/A"
def get_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="Telegram Channel", url=TG_CHANNEL_LINK),
            InlineKeyboardButton(text="WhatsApp Channel", url=WA_CHANNEL)
        ]
    ])
async def fetch_api(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as r:
            try:
                if r.content_type == "application/json":
                    return await r.json()
            except Exception:
                pass
            return await r.text()
def menu_caption(user: types.User):
    prefix = PREFIXES[0]
    return f"""
╭━───〔 𝐂𝐘𝐁𝐈𝐗 𝐕1 〕───━━╮
│ ✦ ᴘʀᴇғɪx : <code>{prefix}</code>
│ ✦ ᴏᴡɴᴇʀ : <b>{OWNER_NAME}</b>
│ ✦ ᴜsᴇʀ : <b>{user.full_name}</b>
│ ✦ ᴜsᴇʀ ɪᴅ : <code>{user.id}</code>
│ ✦ ᴜsᴇʀs : <b>{len(USERS)}</b>
│ ✦ sᴘᴇᴇᴅ : <b>Fast</b>
│ ✦ sᴛᴀᴛᴜs : <b>Online</b>
│ ✦ ᴘʟᴜɢɪɴs : <b>{', '.join(PLUGINS)}</b>
│ ✦ ᴠᴇʀsɪᴏɴ : <b>{VERSION}</b>
│ ✦ ᴛɪᴍᴇ ɴᴏᴡ : <b>{now_time()}</b>
│ ✦ ᴅᴀᴛᴇ ɴᴏᴡ : <b>{now_date()}</b>
│ ✦ ᴍᴇᴍᴏʀʏ : <b>{get_memory()}</b>
╰───────────────────╯
<code>◪  𝐀𝐈 𝐌𝐄𝐍𝐔
  │
  ├─ ❏ chatgpt
  ├─ ❏ openai
  ├─ ❏ blackbox
  ├─ ❏ deepseek
  ├─ ❏ gemini
  └─ ❏ text2img

◪ 𝐃𝐋 𝐌𝐄𝐍𝐔
  │
  ├─ ❏ apk
  ├─ ❏ spotify
  ├─ ❏ gitclone
  ├─ ❏ mediafire
  ├─ ❏ play
  ├─ ❏ gdrive
  └─ ❏ ytmp4

◪ 𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔
  │
  ├─ ❏ repo
  ├─ ❏ ping
  ├─ ❏ runtime
  ├─ ❏ lyrics
  ├─ ❏ sportify-s
  ├─ ❏ yts
  ├─ ❏ weather
  └─ ❏ wallpaper

◪ 𝐅𝐔𝐍 𝐌𝐄𝐍𝐔
  │
  ├─ ❏ joke
  ├─ ❏ quote
  └─ ❏ fact

◪ 𝐃𝐄𝐕 𝐌𝐄𝐍𝐔
  │
  ├─ ❏ statics
  ├─ ❏ listusers
  ├─ ❏ logs
  ├─ ❏ setbanner
  ├─ ❏ setprefix
  ├─ ❏ setbotname
  └─ ❏ broadcast</code>

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐂𝐘𝐁𝐈𝐗 𝐃𝐄𝐕𝐒
"""
bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher(storage=MemoryStorage())

# --- FORCE SUBSCRIBE CHECK ---
async def check_subscribed(user_id):
    try:
        member = await bot.get_chat_member(f"@{TG_CHANNEL}", user_id)
        if member.status in ("creator", "administrator", "member"):
            return True
        return False
    except Exception:
        return False
async def require_subscription(message: types.Message):
    if await check_subscribed(message.from_user.id):
        return True
    await message.answer_photo(
        photo=BANNER_URL,
        caption=(
            "🚫 <b>Access Denied!</b>\n\n"
            "You must <b>join our channel</b> to use this bot.\n"
            f"👉 <a href='{TG_CHANNEL_LINK}'>Join @{TG_CHANNEL}</a> and try again."
        ),
        reply_markup=get_keyboard()
    )
    return False
async def send_banner(message, caption):
    await message.answer_photo(
        photo=BANNER_URL,
        caption=caption,
        reply_markup=get_keyboard()
    )
def prefix_match(text: str, cmd: str):
    return any(text.lower().startswith(p + cmd) for p in PREFIXES)

# --- MAIN HANDLER ---
@dp.message(F.text)
async def all_general_handler(message: types.Message):
    add_user(message.from_user.id)
    if message.chat.type in ("group", "supergroup", "channel"):
        add_chat(message.chat.id)

    txt = (message.text or "").lower()
    # Only menu/start/bot accessible without checking
    if any(prefix_match(txt, c) for c in ["menu", "start", "bot"]):
        await send_banner(message, menu_caption(message.from_user))
        return

    # Force subscribe for all other commands (private only)
    if message.chat.type == "private":
        if not await require_subscription(message):
            return

    # AI MENU
    if prefix_match(txt, "chatgpt"):
        q = message.text.split(" ", 1)[-1] if " " in message.text else "Hello"
        url = f"https://api.princetechn.com/api/ai/gpt?apikey=prince&q={q}"
        js = await fetch_api(url)
        answer = js.get("response", "No response.") if isinstance(js, dict) else str(js)
        await send_banner(message, f"<b>ChatGPT</b>\n\n{answer}")
        return

    if prefix_match(txt, "openai"):
        url = "https://api.princetechn.com/api/ai/openai?apikey=prince&q=Whats+Your+Model"
        js = await fetch_api(url)
        answer = js.get("response", "No response.") if isinstance(js, dict) else str(js)
        await send_banner(message, f"<b>OpenAI</b>\n\n{answer}")
        return

    if prefix_match(txt, "blackbox"):
        url = "https://api.princetechn.com/api/ai/blackbox?apikey=prince&q=Whats+Your+Model"
        js = await fetch_api(url)
        answer = js.get("response", "No response.") if isinstance(js, dict) else str(js)
        await send_banner(message, f"<b>Blackbox</b>\n\n{answer}")
        return

    if prefix_match(txt, "gemini"):
        url = "https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q=Whats+Your+Model"
        js = await fetch_api(url)
        answer = js.get("response", "No response.") if isinstance(js, dict) else str(js)
        await send_banner(message, f"<b>Gemini</b>\n\n{answer}")
        return

    if prefix_match(txt, "deepseek"):
        url = "https://api.princetechn.com/api/ai/deepseek-v3?apikey=prince&q=Whats+Your+Model"
        js = await fetch_api(url)
        answer = js.get("response", "No response.") if isinstance(js, dict) else str(js)
        await send_banner(message, f"<b>Deepseek</b>\n\n{answer}")
        return

    if prefix_match(txt, "text2img"):
        prompt = message.text.split(" ", 1)[-1] if " " in message.text else "A Cute Baby"
        url = f"https://api.princetechn.com/api/ai/text2img?apikey=prince&prompt={prompt}"
        js = await fetch_api(url)
        img_url = js.get("url") or js.get("image") if isinstance(js, dict) else ""
        caption = js.get("response", "Here is your image.") if isinstance(js, dict) else ""
        if img_url:
            await message.answer_photo(
                photo=img_url,
                caption=f"<b>Text2Img</b>\n\n{caption}",
                reply_markup=get_keyboard()
            )
        else:
            await send_banner(message, f"<b>Text2Img</b>\n\n{caption}")
        return

    # DL MENU
    if prefix_match(txt, "apk"):
        app = message.text.split(" ", 1)[-1] if " " in message.text else "Whatsapp"
        url = f"https://api.princetechn.com/api/download/apkdl?apikey=prince&appName={app}"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>APKDL</b>\n\n{result}")
        return

    if prefix_match(txt, "spotify"):
        url = "https://api.princetechn.com/api/download/spotifydlv2?apikey=prince&url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F2DGa7iaidT5s0qnINlwMjJ"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>SpotifyDL</b>\n\n{result}")
        return

    if prefix_match(txt, "gitclone"):
        url = "https://api.princetechn.com/api/download/gitclone?apikey=prince&url=https%3A%2F%2Fgithub.com%2FMayelprince%2FPRINCE-MDXI"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>GitClone</b>\n\n{result}")
        return

    if prefix_match(txt, "mediafire"):
        url = "https://api.princetechn.com/api/download/mediafire?apikey=prince&url=https%3A%2F%2Fwww.mediafire.com%2Ffile%2F6ucfxy4gqtyq6rv%2FCompany_Accounts_issue_of_shares.ppt%2Ffile"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>MediaFire</b>\n\n{result}")
        return

    if prefix_match(txt, "play"):
        url = "https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=https%3A%2F%2Fyoutu.be%2FqF-JLqKtr2Q%3Ffeature%3Dshared"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or js.get("audio") or str(js)
        await send_banner(message, f"<b>YT Play</b>\n\n{result}")
        return

    if prefix_match(txt, "gdrive"):
        url = "https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url=https%3A%2F%2Fdrive.google.com%2Ffile%2Fd%2F1fnq8C1p0y3bEoFeomO56klnMLjbq126c%2Fview%3Fusp%"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>GDriveDL</b>\n\n{result}")
        return

    if prefix_match(txt, "ytmp4"):
        url = "https://api.princetechn.com/api/download/ytmp4?apikey=prince&url=https%3A%2F%2Fyoutu.be%2FwdJrTQJh1ZQ%3Ffeature%3Dshared"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>YTMP4</b>\n\n{result}")
        return

    # OTHER MENU
    if prefix_match(txt, "repo"):
        await send_banner(message, "<b>Source repository:</b>\nhttps://github.com/DOMINATOE/CYBIX-BOT")
        return

    if prefix_match(txt, "ping"):
        await send_banner(message, "<b>Pong!</b>")
        return

    if prefix_match(txt, "runtime"):
        await send_banner(message, f"Uptime: <b>{uptime_str()}</b>")
        return

    if prefix_match(txt, "lyrics"):
        song = message.text.split(" ", 1)[-1] if " " in message.text else "Dynasty Miaa"
        url = f"https://api.princetechn.com/api/search/lyrics?apikey=prince&query={song}"
        js = await fetch_api(url)
        result = js.get("result") or js.get("lyrics") or str(js)
        await send_banner(message, f"<b>Lyrics</b>\n\n{result}")
        return

    if prefix_match(txt, "sportify-s"):
        q = message.text.split(" ", 1)[-1] if " " in message.text else "Spectre"
        url = f"https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query={q}"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>Spotify Search</b>\n\n{result}")
        return

    if prefix_match(txt, "yts"):
        q = message.text.split(" ", 1)[-1] if " " in message.text else "Spectre"
        url = f"https://api.princetechn.com/api/search/yts?apikey=prince&query={q}"
        js = await fetch_api(url)
        result = js.get("result") or js.get("url") or str(js)
        await send_banner(message, f"<b>YTS Search</b>\n\n{result}")
        return

    if prefix_match(txt, "weather"):
        loc = message.text.split(" ", 1)[-1] if " " in message.text else "Kisumu"
        url = f"https://api.princetechn.com/api/search/weather?apikey=prince&location={loc}"
        js = await fetch_api(url)
        result = js.get("result") or str(js)
        await send_banner(message, f"<b>Weather</b>\n\n{result}")
        return

    if prefix_match(txt, "wallpaper"):
        q = message.text.split(" ", 1)[-1] if " " in message.text else "Scary"
        url = f"https://api.princetechn.com/api/search/wallpaper?apikey=prince&query={q}"
        js = await fetch_api(url)
        img_url = js.get("image") or js.get("url") if isinstance(js, dict) else ""
        caption = js.get("response", "Here is your wallpaper.") if isinstance(js, dict) else ""
        if img_url:
            await message.answer_photo(
                photo=img_url,
                caption=f"<b>Wallpaper</b>\n\n{caption}",
                reply_markup=get_keyboard()
            )
        else:
            await send_banner(message, f"<b>Wallpaper</b>\n\n{caption}")
        return

    # FUN MENU (public apis)
    if prefix_match(txt, "joke"):
        url = "https://v2.jokeapi.dev/joke/Any?format=txt"
        joke = await fetch_api(url)
        await send_banner(message, f"<b>Joke</b>\n\n{joke}")
        return

    if prefix_match(txt, "quote"):
        url = "https://api.quotable.io/random"
        js = await fetch_api(url)
        quote = js.get("content") if isinstance(js, dict) else "No quote."
        author = js.get("author") if isinstance(js, dict) else "Unknown"
        await send_banner(message, f"<b>Quote</b>\n\n{quote}\n- <i>{author}</i>")
        return

    if prefix_match(txt, "fact"):
        url = "https://uselessfacts.jsph.pl/random.json?language=en"
        js = await fetch_api(url)
        fact = js.get("text") or "No fact."
        await send_banner(message, f"<b>Random Fact</b>\n\n{fact}")
        return

    # DEV MENU (OWNER ONLY)
    if message.from_user.id == OWNER_ID:
        if prefix_match(txt, "statics"):
            msg = f"<b>Statics:</b>\nUsers: {len(USERS)}\nUptime: {uptime_str()}\nMemory: {get_memory()}"
            await send_banner(message, msg)
            return
        if prefix_match(txt, "listusers"):
            await send_banner(message, "<b>Users:</b>\n" + "\n".join(map(str, USERS)))
            return
        if prefix_match(txt, "logs"):
            await send_banner(message, "<b>No logs available (fileless mode).</b>")
            return
        if prefix_match(txt, "setbanner"):
            await send_banner(message, "<b>Banner is static in this version. Edit code to change.</b>")
            return
        if prefix_match(txt, "setprefix"):
            np = message.text.split(" ", 1)[-1].strip()
            if np and np not in PREFIXES:
                PREFIXES.insert(0, np)
                await send_banner(message, f"Prefix changed to <b>{np}</b>")
            else:
                await send_banner(message, "Usage: .setprefix <newprefix>")
            return
        if prefix_match(txt, "setbotname"):
            await send_banner(message, "<b>Bot name is static in this version. Edit code to change.</b>")
            return
        if prefix_match(txt, "broadcast"):
            parts = message.text.split(" ", 1)
            if len(parts) < 2:
                await send_banner(message, "Usage: .broadcast <message>")
                return
            bmsg = parts[1]
            # Broadcast to all users and chats
            count = 0
            err = 0
            for uid in USERS:
                try:
                    await bot.send_photo(
                        chat_id=uid,
                        photo=BANNER_URL,
                        caption=bmsg,
                        reply_markup=get_keyboard()
                    )
                    count += 1
                except Exception:
                    err += 1
            for cid in CHATS:
                try:
                    await bot.send_photo(
                        chat_id=cid,
                        photo=BANNER_URL,
                        caption=bmsg,
                        reply_markup=get_keyboard()
                    )
                    count += 1
                except Exception:
                    err += 1
            await send_banner(message, f"Broadcast sent!\n✅ Success: <b>{count}</b>\n❌ Failed: <b>{err}</b>")
            return

    # Unknown Command
    if txt.startswith(tuple(PREFIXES)):
        await send_banner(message, "<b>Unknown command!</b>\nUse .menu to see all commands.")

if __name__ == "__main__":
    logger.info("Starting CYBIX Bot...")
    try:
        asyncio.run(dp.start_polling(bot, skip_updates=True))
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped.")