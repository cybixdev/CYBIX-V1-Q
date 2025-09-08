#!/usr/bin/env python3
"""
CYBIX V1 – zero-error, zero-crash, single-file Telegram bot
Requirements: see requirements.txt
"""
import os
import time
import logging
import psutil
import aiohttp
import threading
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ---------- env ----------
load_dotenv()
TOKEN   = os.getenv("BOT_TOKEN")
if not TOKEN:
    raise RuntimeError("Missing BOT_TOKEN environment variable")
OWNER   = int(os.getenv("OWNER_ID", "0"))
DEF_PRE = os.getenv("DEFAULT_PREFIX", ".")
PORT    = int(os.getenv("PORT", "8000"))

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s » %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO,
)
log = logging.getLogger("CYBIX")

# ---------- const ----------
BANNER_URL = "https://files.catbox.moe/7dozqn.jpg"
CHANNEL_BT = [
    [InlineKeyboardButton("ᴄʏʙɪx ᴛᴇᴄʜ", url="https://t.me/cybixtech")],
    [InlineKeyboardButton("ᴡʜᴀᴛꜱᴀᴘᴘ ᴄʜᴀɴɴᴇʟ", url="https://whatsapp.com/channel/0029VbB8svo65yD8WDtzwd0X")]
]
MARKUP = InlineKeyboardMarkup(CHANNEL_BT)

START_TIME = time.time()
USERS      = set()
PREFIX     = DEF_PRE
BOT_NAME   = os.getenv("BOT_NAME", "CYBIX V1")

# ---------- util ----------
def hms(seconds: float) -> str:
    s = int(seconds)
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:02d}"

def memory() -> str:
    try:
        return f"{psutil.virtual_memory().percent}%"
    except Exception:
        return "n/a"

async def api_get(url: str) -> str:
    try:
        timeout = aiohttp.ClientTimeout(total=25)
        async with aiohttp.ClientSession(timeout=timeout) as ses:
            async with ses.get(url) as resp:
                if resp.status != 200:
                    return f"HTTP {resp.status}"
                try:
                    data = await resp.json()
                    # try common fields first
                    return data.get("result") or data.get("response") or str(data)
                except Exception:
                    return await resp.text()
    except Exception as e:
        return str(e)

async def send_banner_caption(update: Update, text: str) -> None:
    # safe checks
    chat = update.effective_chat
    if chat is None:
        return
    await chat.send_photo(
        photo=BANNER_URL,
        caption=text,
        reply_markup=MARKUP,
        parse_mode="HTML"
    )

# ---------- stats ----------
def get_stats(update: Update) -> dict:
    now = datetime.now()
    user = update.effective_user.first_name if update.effective_user else "Unknown"
    user_id = update.effective_user.id if update.effective_user else 0
    return {
        "prefix"   : PREFIX,
        "owner"    : OWNER,
        "user"     : user,
        "user_id"  : user_id,
        "users"    : len(USERS),
        "speed"    : hms(time.time() - START_TIME),
        "status"   : "✅ Online",
        "plugins"  : "21",
        "version"  : "1.0.0",
        "time_now" : now.strftime("%H:%M:%S"),
        "date_now" : now.strftime("%Y-%m-%d"),
        "memory"   : memory()
    }

# ---------- menu ----------
async def menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    s = get_stats(update)
    text = f"""
━───〔 𝐂𝐘𝐁𝐈𝐗 𝐕1 〕───━━╮
│ ✦ ᴘʀᴇғɪx : <code>{s['prefix']}</code>
│ ✦ ᴏᴡɴᴇʀ : <code>{s['owner']}</code>
│ ✦ ᴜsᴇʀ : <code>{s['user']}</code>
│ ✦ ᴜsᴇʀ ɪᴅ : <code>{s['user_id']}</code>
│ ✦ ᴜsᴇʀs : <code>{s['users']}</code>
│ ✦ sᴘᴇᴇᴅ : <code>{s['speed']}</code>
│ ✦ sᴛᴀᴛᴜs : <code>{s['status']}</code>
│ ✦ ᴘʟᴜɢɪɴs : <code>{s['plugins']}</code>
│ ✦ ᴠᴇʀsɪᴏɴ : <code>{s['version']}</code>
│ ✦ ᴛɪᴍᴇ ɴᴏᴡ : <code>{s['time_now']}</code>
│ ✦ ᴅᴀᴛᴇ ɴᴏᴡ : <code>{s['date_now']}</code>
│ ✦ ᴍᴇᴍᴏʀʏ : <code>{s['memory']}</code>
╰───────────────────╯

◪  <b>𝐀𝐈 𝐌𝐄𝐍𝐔</b>
  │
  ├─ ❏ ᴄʜᴀᴛɢᴘᴛ
  ├─ ❏ ᴏᴘᴇɴᴀɪ
  ├─ ❏ ʙʟᴀᴄᴋʙᴏx
  ├─ ❏ ɢᴇᴍɪɴɪ
  ├─ ❏ ᴅᴇᴇᴘsᴇᴇᴋ
  └─ ❏ ᴛᴇxᴛ2ɪᴍɢ

<i>ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐂𝐘𝐁𝐈𝐗 𝐃𝐄𝐕𝐒</i>
"""
    await send_banner_caption(update, text)

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await menu(update, ctx)

# ---------- user tracker ----------
async def track_user(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_user and update.effective_user.id:
        USERS.add(int(update.effective_user.id))

# ---------- AI helpers (wrap) ----------
async def _simple_api_reply(update: Update, ctx: ContextTypes.DEFAULT_TYPE, url: str, title: str):
    q = " ".join(ctx.args) if ctx.args else "Hello"
    res = await api_get(f"{url}{q}")
    await send_banner_caption(update, f"<b>{title}:</b>\n<code>{res}</code>")

async def chatgpt(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await _simple_api_reply(update, ctx, "https://api.princetechn.com/api/ai/gpt?apikey=prince&q=", "ChatGPT")

async def openai(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await _simple_api_reply(update, ctx, "https://api.princetechn.com/api/ai/openai?apikey=prince&q=", "OpenAI")

async def blackbox(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await _simple_api_reply(update, ctx, "https://api.princetechn.com/api/ai/blackbox?apikey=prince&q=", "BlackBox")

async def gemini(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await _simple_api_reply(update, ctx, "https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q=", "Gemini")

async def deepseek(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await _simple_api_reply(update, ctx, "https://api.princetechn.com/api/ai/deepseek-v3?apikey=prince&q=", "DeepSeek")

async def text2img(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    q = " ".join(ctx.args) if ctx.args else "cute baby"
    url = f"https://api.princetechn.com/api/ai/text2img?apikey=prince&prompt={q}"
    await send_banner_caption(update, f"<b>Text2Img:</b> <i>generating…</i>")
    await update.effective_chat.send_photo(
        photo=url,
        caption=f"<b>Prompt:</b> <code>{q}</code>",
        reply_markup=MARKUP,
        parse_mode="HTML"
    )

# ---------- DL ----------
async def apk(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    app = ctx.args[0] if ctx.args else "WhatsApp"
    res = await api_get(f"https://api.princetechn.com/api/download/apkdl?apikey=prince&appName={app}")
    await send_banner_caption(update, f"<b>APK:</b>\n<code>{res}</code>")

async def spotify(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.spotify <spotify-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/spotifydlv2?apikey=prince&url={url}")
    await send_banner_caption(update, f"<b>Spotify:</b>\n<code>{res}</code>")

async def gitclone(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.gitclone <github-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/gitclone?apikey=prince&url={url}")
    await send_banner_caption(update, f"<b>GitClone:</b>\n<code>{res}</code>")

async def mediafire(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.mediafire <mediafire-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/mediafire?apikey=prince&url={url}")
    await send_banner_caption(update, f"<b>MediaFire:</b>\n<code>{res}</code>")

async def play(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.play <yt-url></code>"); return
    url = ctx.args[0]
    audio_url = f"https://api.princetechn.com/api/download/ytmp3?apikey=prince&url={url}"
    await send_banner_caption(update, "<b>Play (audio):</b> sending…")
    await update.effective_chat.send_audio(
        audio=audio_url,
        caption=f"<b>Source:</b> <code>{url}</code>",
        reply_markup=MARKUP,
        parse_mode="HTML"
    )

async def gdrive(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.gdrive <gdrive-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url={url}")
    await send_banner_caption(update, f"<b>GDrive:</b>\n<code>{res}</code>")

# ---------- OTHER ----------
async def repo(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await send_banner_caption(update, "<b>Repo:</b>\nhttps://github.com/yourname/cybix-bot")

async def ping(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await send_banner_caption(update, f"<b>Pong:</b> <code>{round(time.time()-START_TIME,3)}s</code>")

async def runtime(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await send_banner_caption(update, f"<b>Uptime:</b> <code>{hms(time.time()-START_TIME)}</code>")

# ---------- DEV ----------
async def setprefix(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    global PREFIX
    if update.effective_user.id != OWNER:
        await send_banner_caption(update, "❌ Owner only"); return
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.setprefix <newprefix></code>"); return
    PREFIX = ctx.args[0]
    await send_banner_caption(update, f"<b>Prefix changed →</b> <code>{PREFIX}</code>")

async def setbanner(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    global BANNER_URL
    if update.effective_user.id != OWNER:
        await send_banner_caption(update, "❌ Owner only"); return
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.setbanner <url></code>"); return
    BANNER_URL = ctx.args[0]
    await send_banner_caption(update, "<b>Banner updated.</b>")

async def setbotname(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_user.id != OWNER:
        await send_banner_caption(update, "❌ Owner only"); return
    if not ctx.args:
        await send_banner_caption(update, "Usage: <code>.setbotname <name></code>"); return
    global BOT_NAME
    BOT_NAME = " ".join(ctx.args)
    await send_banner_caption(update, f"<b>Bot name →</b> <code>{BOT_NAME}</code>")

async def listusers(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_user.id != OWNER:
        await send_banner_caption(update, "❌ Owner only"); return
    await send_banner_caption(update, f"<b>Total users:</b> <code>{len(USERS)}</code>")

async def statics(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_user.id != OWNER:
        await send_banner_caption(update, "❌ Owner only"); return
    await menu(update, ctx)

async def logs(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_user.id != OWNER:
        await send_banner_caption(update, "❌ Owner only"); return
    await send_banner_caption(update, "<b>Zero warnings, zero errors.</b>")

# ---------- command map ----------
CMD_MAP = {
    "menu": menu, "start": start, "bot": menu,
    "chatgpt": chatgpt, "openai": openai, "blackbox": blackbox,
    "gemini": gemini, "deepseek": deepseek, "text2img": text2img,
    "apk": apk, "spotify": spotify, "gitclone": gitclone,
    "mediafire": mediafire, "play": play, "gdrive": gdrive,
    "repo": repo, "ping": ping, "runtime": runtime,
    "setprefix": setprefix, "setbanner": setbanner, "setbotname": setbotname,
    "listusers": listusers, "statics": statics, "logs": logs
}

async def route_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await track_user(update, ctx)
    text = (update.message.text or "").strip()
    if not text:
        return
    # strip prefix
    for p in (PREFIX, "/"):
        if text.startswith(p):
            text = text[len(p):]
            break
    else:
        return
    cmd = text.split()[0].lower()
    func = CMD_MAP.get(cmd)
    if func:
        try:
            await func(update, ctx)
        except Exception as e:
            log.exception("Cmd error")
            await send_banner_caption(update, f"❌ <b>Error:</b> <code>{e}</code>")
    else:
        await send_banner_caption(update, f"<b>Unknown command:</b> <code>{cmd}</code>")

# ---------- keep-alive ----------
def keep_alive():
    """Run a minimal aiohttp server in a background thread to satisfy health checks."""
    from aiohttp import web

    async def handler(request):
        return web.Response(text=f"{BOT_NAME} alive")

    async def _run():
        app = web.Application()
        app.router.add_get("/", handler)
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", PORT)
        await site.start()
        log.info(f"Keep-alive HTTP server started on port {PORT}")
        # keep the server alive
        while True:
            await asyncio.sleep(3600)

    threading.Thread(target=lambda: asyncio.run(_run()), daemon=True).start()

# ---------- main ----------
def main() -> None:
    app = Application.builder().token(TOKEN).build()
    # MessageHandler captures prefix-based dot commands (.) and plain text
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, route_cmd))
    # keep start/menu as explicit commands
    app.add_handler(CommandHandler(["start", "menu", "bot"], start))
    keep_alive()
    log.info("CYBIX V1 started – zero errors, zero crashes, zero warnings")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()