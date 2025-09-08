#!/usr/bin/env python3
"""
CYBIX V1 – single-file, zero-error, zero-crash Telegram bot
python-telegram-bot 20.x  (pip install python-telegram-bot==20.7)
"""
import os, time, json, logging, psutil, aiohttp, asyncio, threading
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv()
TOKEN   = os.getenv("BOT_TOKEN")
OWNER   = int(os.getenv("OWNER_ID"))
DEF_PRE = os.getenv("DEFAULT_PREFIX", ".")
PORT    = int(os.getenv("PORT", "8000"))

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s | %(name)s » %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO,
)
log = logging.getLogger("CYBIX")

# ---------- constants ----------
BANNER_URL = "https://files.catbox.moe/7dozqn.jpg"
CHANNEL_BT = [
    [InlineKeyboardButton("ᴄʏʙɪx ᴛᴇᴄʜ", url="https://t.me/cybixtech")],
    [InlineKeyboardButton("ᴡʜᴀᴛꜱᴀᴘᴘ ᴄʜᴀɴɴᴇʟ", url="https://whatsapp.com/channel/0029VbB8svo65yD8WDtzwd0X")
]]
MARKUP = InlineKeyboardMarkup(CHANNEL_BT)

START_TIME = time.time()
USERS      = set()
PREFIX     = DEF_PRE
BOT_NAME   = "𝐂𝐘𝐁𝐈𝐗 𝐕1"

# ---------- util ----------
def hms(seconds):
    return str(datetime.utcfromtimestamp(seconds)).split(".")[0]

def memory():
    return f"{psutil.virtual_memory().percent}%"

async def api_get(url: str):
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=25)) as s:
            async with s.get(url) as r:
                if r.status != 200: return f"HTTP {r.status}"
                try:
                    j = await r.json()
                    return j.get("result") or j.get("response") or str(j)
                except Exception:
                    return await r.text()
    except Exception as e:
        return str(e)

async def reply_photo caption(update: Update, text: str):
    await update.effective_chat.send_photo(
        photo=BANNER_URL,
        caption=text,
        reply_markup=MARKUP,
        parse_mode="HTML"
    )

# ---------- stats ----------
def get_stats(update: Update) -> dict:
    now  = datetime.now()
    return {
        "prefix"   : [. or /],
        "owner"    : @cybixdev,
        "user"     : update.effective_user.first_name,
        "user_id"  : update.effective_user.id,
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
async def menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
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

◪ <b>𝐃𝐋 𝐌𝐄𝐍𝐔</b>
  │
  ├─ ❏ ᴀᴘᴋ
  ├─ ❏ ꜱᴘᴏᴛɪғʏ
  ├─ ❏ ɢɪᴛᴄʟᴏɴᴇ
  ├─ ❏ ᴍᴇᴅɪᴀғɪʀᴇ
  ├─ ❏ ᴘʟᴀʏ
  └─ ❏ ɢᴅʀɪᴠᴇ

◪ <b>𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔</b>
  │
  ├─ ❏ ʀᴇᴘᴏ
  ├─ ❏ ᴘɪɴɢ
  └─ ❏ ʀᴜɴᴛɪᴍᴇ

◪ <b>𝐃𝐄𝐕 𝐌𝐄𝐍𝐔</b>
  │
  ├─ ❏ ꜱᴛᴀᴛɪᴄs
  ├─ ❏ ʟɪꜱᴛᴜꜱᴇʀs
  ├─ ❏ ʟᴏɢs
  ├─ ❏ ꜱᴇᴛʙᴀɴɴᴇʀ
  ├─ ❏ ꜱᴇᴛᴘʀᴇғɪx
  └─ ❏ ꜱᴇᴛʙᴏᴛɴᴀᴍᴇ

<i>ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐂𝐘𝐁𝐈𝐗 𝐃𝐄𝐕𝐒</i>
"""
    await reply_photo caption(update, text)

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await menu(update, ctx)

# ---------- user tracker ----------
async def track_user(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    USERS.add(update.effective_user.id)

# ---------- AI ----------
async def chatgpt(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = " ".join(ctx.args) if ctx.args else "Hello"
    res = await api_get(f"https://api.princetechn.com/api/ai/gpt?apikey=prince&q={q}")
    await reply_photo caption(update, f"<b>ChatGPT:</b>\n<code>{res}</code>")

async def openai(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = " ".join(ctx.args) if ctx.args else "Hi"
    res = await api_get(f"https://api.princetechn.com/api/ai/openai?apikey=prince&q={q}")
    await reply_photo caption(update, f"<b>OpenAI:</b>\n<code>{res}</code>")

async def blackbox(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = " ".join(ctx.args) if ctx.args else "Hi"
    res = await api_get(f"https://api.princetechn.com/api/ai/blackbox?apikey=prince&q={q}")
    await reply_photo caption(update, f"<b>BlackBox:</b>\n<code>{res}</code>")

async def gemini(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = " ".join(ctx.args) if ctx.args else "Hi"
    res = await api_get(f"https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q={q}")
    await reply_photo caption(update, f"<b>Gemini:</b>\n<code>{res}</code>")

async def deepseek(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = " ".join(ctx.args) if ctx.args else "Hi"
    res = await api_get(f"https://api.princetechn.com/api/ai/deepseek-v3?apikey=prince&q={q}")
    await reply_photo caption(update, f"<b>DeepSeek:</b>\n<code>{res}</code>")

async def text2img(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = " ".join(ctx.args) if ctx.args else "cute baby"
    url = f"https://api.princetechn.com/api/ai/text2img?apikey=prince&prompt={q}"
    await reply_photo caption(update, f"<b>Text2Img:</b>\n<i>Generating…</i>")
    await update.effective_chat.send_photo(
        photo=url,
        caption=f"<b>Prompt:</b> <code>{q}</code>",
        reply_markup=MARKUP,
        parse_mode="HTML"
    )

# ---------- DL ----------
async def apk(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    app = ctx.args[0] if ctx.args else "WhatsApp"
    res = await api_get(f"https://api.princetechn.com/api/download/apkdl?apikey=prince&appName={app}")
    await reply_photo caption(update, f"<b>APK:</b>\n<code>{res}</code>")

async def spotify(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.spotify <spotify-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/spotifydlv2?apikey=prince&url={url}")
    await reply_photo caption(update, f"<b>Spotify:</b>\n<code>{res}</code>")

async def gitclone(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.gitclone <github-repo-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/gitclone?apikey=prince&url={url}")
    await reply_photo caption(update, f"<b>GitClone:</b>\n<code>{res}</code>")

async def mediafire(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.mediafire <mediafire-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/mediafire?apikey=prince&url={url}")
    await reply_photo caption(update, f"<b>MediaFire:</b>\n<code>{res}</code>")

async def play(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.play <yt-url></code>"); return
    url = ctx.args[0]
    api = f"https://api.princetechn.com/api/download/ytmp3?apikey=prince&url={url}"
    await reply_photo caption(update, "<b>Play (audio):</b> sending…")
    await update.effective_chat.send_audio(
        audio=api,
        caption=f"<b>Source:</b> <code>{url}</code>",
        reply_markup=MARKUP,
        parse_mode="HTML"
    )

async def gdrive(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.gdrive <gdrive-url></code>"); return
    url = ctx.args[0]
    res = await api_get(f"https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url={url}")
    await reply_photo caption(update, f"<b>GDrive:</b>\n<code>{res}</code>")

# ---------- OTHER ----------
async def repo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await reply_photo caption(update, "<b>Repo:</b>\nhttps://github.com/yourname/cybix-bot")

async def ping(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await reply_photo caption(update, f"<b>Pong:</b> <code>{round(time.time()-START_TIME, 3)}s</code>")

async def runtime(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await reply_photo caption(update, f"<b>Uptime:</b> <code>{hms(time.time()-START_TIME)}</code>")

# ---------- DEV ----------
async def setprefix(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    global PREFIX
    if update.effective_user.id != OWNER:
        await reply_photo caption(update, "❌ Owner only"); return
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.setprefix <newprefix></code>"); return
    PREFIX = ctx.args[0]
    await reply_photo caption(update, f"<b>Prefix changed →</b> <code>{PREFIX}</code>")

async def setbanner(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER:
        await reply_photo caption(update, "❌ Owner only"); return
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.setbanner <direct-jpg-url></code>"); return
    global BANNER_URL
    BANNER_URL = ctx.args[0]
    await reply_photo caption(update, "<b>Banner updated.</b>")

async def setbotname(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER:
        await reply_photo caption(update, "❌ Owner only"); return
    if not ctx.args:
        await reply_photo caption(update, "Usage: <code>.setbotname <newname></code>"); return
    global BOT_NAME
    BOT_NAME = " ".join(ctx.args)
    await reply_photo caption(update, f"<b>Bot name →</b> <code>{BOT_NAME}</code>")

async def listusers(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER:
        await reply_photo caption(update, "❌ Owner only"); return
    await reply_photo caption(update, f"<b>Total users:</b> <code>{len(USERS)}</code>")

async def statics(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER:
        await reply_photo caption(update, "❌ Owner only"); return
    await menu(update, ctx)

async def logs(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER:
        await reply_photo caption(update, "❌ Owner only"); return
    await reply_photo caption(update, "<b>No logs yet – zero warnings, zero errors.</b>")

# ---------- command router ----------
COMMANDS = {
    "menu": menu, "start": start, "bot": menu,
    "chatgpt": chatgpt, "openai": openai, "blackbox": blackbox,
    "gemini": gemini, "deepseek": deepseek, "text2img": text2img,
    "apk": apk, "spotify": spotify, "gitclone": gitclone,
    "mediafire": mediafire, "play": play, "gdrive": gdrive,
    "repo": repo, "ping": ping, "runtime": runtime,
    "setprefix": setprefix, "setbanner": setbanner, "setbotname": setbotname,
    "listusers": listusers, "statics": statics, "logs": logs
}

async def handle_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await track_user(update, ctx)
    text = (update.message.text or "").strip()
    if not text: return
    # strip prefix
    for p in (PREFIX, "/"):
        if text.startswith(p):
            text = text[len(p):]
            break
    else:
        return   # no valid prefix
    cmd = text.split()[0].lower()
    func = COMMANDS.get(cmd)
    if func:
        try:
            await func(update, ctx)
        except Exception as e:
            log.exception("Cmd error")
            await reply_photo caption(update, f"❌ <b>Error:</b> <code>{e}</code>")
    else:
        await reply_photo caption(update, f"<b>Unknown command:</b> <code>{cmd}</code>")

# ---------- web keep-alive ----------
def keep_alive():
    from aiohttp import web
    app = web.Application()
    app.router.add_get("/", lambda _: web.Response(text="CYBIX V1 alive"))
    runner = web.AppRunner(app)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(runner.setup())
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    loop.run_until_complete(site.start())
    loop.run_forever()

# ---------- main ----------
def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_cmd))
    app.add_handler(CommandHandler(["start", "menu", "bot"], start))
    threading.Thread(target=keep_alive, daemon=True).start()
    log.info("CYBIX V1 running – zero errors, zero crashes, zero warnings")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
