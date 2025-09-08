require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

// ENV
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const PORT = process.env.PORT || 8080;
if (!BOT_TOKEN || !OWNER_ID) {
  console.error("[ERROR] BOT_TOKEN or OWNER_ID missing in .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN, { handlerTimeout: 60_000 });

// GLOBAL STATE
let prefix = ['.', '/'];
let botName = 'CYBIX V1';
let bannerUrl = "https://files.catbox.moe/7dozqn.jpg";
let mainChannels = [
  { text: 'Telegram Channel', url: 'https://t.me/cybixtech' },
  { text: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VbB8svo65yD8WDtzwd0X' }
];
const botStats = {
  users: new Set(),
  startedAt: Date.now()
};

function getBotStats(ctx) {
  return {
    prefix: prefix.join(', '),
    owner: OWNER_ID,
    user: ctx?.from?.first_name || 'User',
    user_id: ctx?.from?.id || 'N/A',
    users: botStats.users.size,
    speed: Math.floor(Math.random() * 100) + "ms",
    status: "Online",
    plugins: Object.keys(plugins).length,
    version: pkg.version || "1.0.0",
    time_now: new Date().toLocaleTimeString(),
    date_now: new Date().toLocaleDateString(),
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    uptime: `${Math.floor((Date.now() - botStats.startedAt) / 1000)}s`
  };
}

function getMenu(ctx) {
  const stats = getBotStats(ctx);
  return `╭━───〔 ${botName} 〕───━━╮
│ ✦ ᴘʀᴇғɪx : ${stats.prefix}
│ ✦ ᴏᴡɴᴇʀ : ${stats.owner}
│ ✦ ᴜsᴇʀ : ${stats.user}
│ ✦ ᴜsᴇʀ ɪᴅ : ${stats.user_id}
│ ✦ ᴜsᴇʀs : ${stats.users}
│ ✦ sᴘᴇᴇᴅ : ${stats.speed}
│ ✦ sᴛᴀᴛᴜs : ${stats.status}
│ ✦ ᴘʟᴜɢɪɴs : ${stats.plugins}
│ ✦ ᴠᴇʀsɪᴏɴ : ${stats.version}
│ ✦ ᴛɪᴍᴇ ɴᴏᴡ : ${stats.time_now}
│ ✦ ᴅᴀᴛᴇ ɴᴏᴡ : ${stats.date_now}
│ ✦ ᴍᴇᴍᴏʀʏ : ${stats.memory}
│ ✦ ᴜᴘᴛɪᴍᴇ : ${stats.uptime}
╰───────────────────╯
╭━━【 𝐀𝐈 𝐌𝐄𝐍𝐔 】━━
┃ • ᴄʜᴀᴛɢᴘᴛ
┃ • ᴏᴘᴇɴᴀɪ
┃ • ʙʟᴀᴄᴋʙᴏx
┃ • ɢᴇᴍɪɴɪ
┃ • ᴅᴇᴇᴘsᴇᴇᴋ
┃ • ᴛᴇxᴛ2ɪᴍɢ
╰━━━━━━━━━━━━━━━
╭━━【 𝐃𝐋 𝐌𝐄𝐍𝐔 】━━
┃ • ᴀᴘᴋ
┃ • sᴘᴏᴛɪғʏ
┃ • ɢɪᴛᴄʟᴏɴᴇ
┃ • ᴍᴇᴅɪᴀғɪʀᴇ
┃ • ᴘʟᴀʏ
┃ • ɢᴅʀɪᴠᴇ 
╰━━━━━━━━━━━━━━━
╭━━【 𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔 】━━
┃ • ʀᴇᴘᴏ
┃ • ᴘɪɴɢ
┃ • ʀᴜɴᴛɪᴍᴇ
╰━━━━━━━━━━━━━━━
╭━━【 𝐀𝐃𝐔𝐋𝐓 𝐌𝐄𝐍𝐔 】━━
┃ • xᴠɪᴅᴇᴏsᴇᴀʀᴄʜ
┃ • xɴxxsᴇᴀʀᴄʜ
┃ • ᴅʟ-xɴxxᴠɪᴅ
┃ • ᴅʟ-xᴠɪᴅᴇᴏ
╰━━━━━━━━━━━━━━━
╭━━【𝐃𝐄𝐕 𝐌𝐄𝐍𝐔】━━
┃ • sᴛᴀᴛɪᴄs
┃ • ʟɪsᴛᴜsᴇʀs
┃ • ʟᴏɢs
┃ • sᴇᴛʙᴀɴɴᴇʀ
┃ • sᴇᴛᴘʀᴇғɪx
┃ • sᴇᴛʙᴏᴛɴᴀᴍᴇ
┃ • ʙʀᴏᴀᴅᴄᴀsᴛ
┃ • restart
╰━━━━━━━━━━━━━━━

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐂𝐘𝐁𝐈𝐗 𝐃𝐄𝐕𝐒`;
}

function menuButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.url(mainChannels[0].text, mainChannels[0].url)],
    [Markup.button.url(mainChannels[1].text, mainChannels[1].url)]
  ]);
}

async function sendBannerMenu(ctx, text) {
  try {
    await ctx.replyWithPhoto(
      { url: bannerUrl },
      {
        caption: text || getMenu(ctx),
        ...menuButtons()
      }
    );
  } catch (err) {
    await ctx.reply(text || getMenu(ctx), menuButtons());
  }
}

bot.use(async (ctx, next) => {
  if (ctx.from) botStats.users.add(ctx.from.id);
  await next();
});

// PLUGIN SYSTEM
const plugins = {};
function registerPlugin(name, handler) { plugins[name] = handler; }

// -------- PLUGINS -------- //
registerPlugin('chatgpt', async (ctx, args) => {
  let q = args.join(' '); if (!q) return ctx.reply('❌ Provide a prompt.');
  try {
    let url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(q)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🤖 ChatGPT:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch ChatGPT."); }
});
registerPlugin('openai', async (ctx) => {
  try {
    let url = `https://api.princetechn.com/api/ai/openai?apikey=prince&q=Whats+Your+Model`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🤖 OpenAI:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch OpenAI."); }
});
registerPlugin('blackbox', async (ctx) => {
  try {
    let url = `https://api.princetechn.com/api/ai/blackbox?apikey=prince&q=Whats+Your+Model`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🤖 Blackbox:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Blackbox."); }
});
registerPlugin('gemini', async (ctx) => {
  try {
    let url = `https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q=Whats+Your+Model`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🤖 Gemini:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Gemini."); }
});
registerPlugin('deepseek', async (ctx) => {
  try {
    let url = `https://api.princetechn.com/api/ai/deepseek-v3?apikey=prince&q=Whats+Your+Model`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🤖 Deepseek:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Deepseek."); }
});
registerPlugin('text2img', async (ctx, args) => {
  let prompt = args.join(' ') || "A Cute Baby";
  try {
    let url = `https://api.princetechn.com/api/ai/text2img?apikey=prince&prompt=${encodeURIComponent(prompt)}`;
    let { data } = await axios.get(url);
    if (data.result && typeof data.result === 'string' && data.result.startsWith('http')) {
      await ctx.replyWithPhoto({ url: data.result }, { caption: `🖼️ Generated for: ${prompt}`, ...menuButtons() });
    } else {
      await sendBannerMenu(ctx, "❌ No image returned.");
    }
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch image."); }
});
registerPlugin('lyrics', async (ctx, args) => {
  let song = args.join(' ') || "Dynasty Miaa";
  try {
    let url = `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(song)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🎵 Lyrics:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch lyrics."); }
});
registerPlugin('spotify', async (ctx, args) => {
  let q = args.join(' ') || "Spectre";
  try {
    let url = `https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${encodeURIComponent(q)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🎧 Spotify:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Spotify results."); }
});
registerPlugin('yts', async (ctx, args) => {
  let q = args.join(' ') || "Spectre";
  try {
    let url = `https://api.princetechn.com/api/search/yts?apikey=prince&query=${encodeURIComponent(q)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🎬 YTS:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch YTS."); }
});
registerPlugin('weather', async (ctx, args) => {
  let loc = args.join(' ') || "Kisumu";
  try {
    let url = `https://api.princetechn.com/api/search/weather?apikey=prince&location=${encodeURIComponent(loc)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `☁️ Weather:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch weather."); }
});
registerPlugin('wallpaper', async (ctx, args) => {
  let q = args.join(' ') || "Scary";
  try {
    let url = `https://api.princetechn.com/api/search/wallpaper?apikey=prince&query=${encodeURIComponent(q)}`;
    let { data } = await axios.get(url);
    if (data.result && typeof data.result === 'string' && data.result.startsWith('http')) {
      await ctx.replyWithPhoto({ url: data.result }, { caption: `🖼️ Wallpaper for: ${q}`, ...menuButtons() });
    } else {
      await sendBannerMenu(ctx, "❌ No wallpaper returned.");
    }
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch wallpaper."); }
});
registerPlugin('apk', async (ctx, args) => {
  let app = args.join(' ') || "Whatsapp";
  try {
    let url = `https://api.princetechn.com/api/download/apkdl?apikey=prince&appName=${encodeURIComponent(app)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `📲 APK:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch APK."); }
});
registerPlugin('spotifydl', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://open.spotify.com/track/2DGa7iaidT5s0qnINlwMjJ";
  try {
    let url = `https://api.princetechn.com/api/download/spotifydlv2?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🎧 Spotify DL:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Spotify download."); }
});
registerPlugin('gitclone', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://github.com/Mayelprince/PRINCE-MDXI";
  try {
    let url = `https://api.princetechn.com/api/download/gitclone?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🔗 GitClone:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch GitClone."); }
});
registerPlugin('mediafire', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://www.mediafire.com/file/6ucfxy4gqtyq6rv/Company_Accounts_issue_of_shares.ppt/file";
  try {
    let url = `https://api.princetechn.com/api/download/mediafire?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `📦 Mediafire:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Mediafire."); }
});
registerPlugin('play', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://youtu.be/qF-JLqKtr2Q?feature=shared";
  try {
    let url = `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    if (data.result && typeof data.result === 'string' && data.result.startsWith('http')) {
      await ctx.replyWithAudio({ url: data.result }, { caption: "🎵 Play result", ...menuButtons() });
    } else {
      await sendBannerMenu(ctx, "❌ No audio returned.");
    }
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch Play."); }
});
registerPlugin('ytmp4', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://youtu.be/wdJrTQJh1ZQ?feature=shared";
  try {
    let url = `https://api.princetechn.com/api/download/ytmp4?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `📹 YTMP4:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch YTMP4."); }
});
registerPlugin('gdrive', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://drive.google.com/file/d/1fnq8C1p0y3bEoFeomO56klnMLjbq126c/view?usp=drive_link";
  try {
    let url = `https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `📁 GDrive:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch GDrive."); }
});
registerPlugin('xvideosearch', async (ctx, args) => {
  let q = args.join(' ') || "Mom and Son";
  try {
    let url = `https://api.princetechn.com/api/search/xvideossearch?apikey=prince&query=${encodeURIComponent(q)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🔞 XVideos:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch XVideos."); }
});
registerPlugin('xnxxsearch', async (ctx, args) => {
  let q = args.join(' ') || "Mom and Son";
  try {
    let url = `https://api.princetechn.com/api/search/xnxxsearch?apikey=prince&query=${encodeURIComponent(q)}`;
    let { data } = await axios.get(url);
    let resultMsg = Array.isArray(data.result) ? data.result.join('\n') : (data.result || data.response || JSON.stringify(data));
    await sendBannerMenu(ctx, `🔞 XNXX:\n${resultMsg}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch XNXX."); }
});
registerPlugin('dl-xnxxvid', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://www.xnxx.health/video-1256sd47/stepbrother_and_stepsister_learn_about_sex_-_step_mother_family_sex_female_anatomy_accidental_creampie";
  try {
    let url = `https://api.princetechn.com/api/download/xnxxdl?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🔞 DL-XNXX:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch DL-XNXX."); }
});
registerPlugin('dl-xvideo', async (ctx, args) => {
  let urlArg = args.join(' ') || "https://www.xvideos.com/video.uphdukv604c/novinha_gulosa_pediu_pra_colocar_tudo_dentro_da_bucetinha_e_recebeu_enorme_gozada";
  try {
    let url = `https://api.princetechn.com/api/download/xvideosdl?apikey=prince&url=${encodeURIComponent(urlArg)}`;
    let { data } = await axios.get(url);
    await sendBannerMenu(ctx, `🔞 DL-XVideo:\n${data.result || data.response || JSON.stringify(data)}`);
  } catch { await sendBannerMenu(ctx, "❌ Failed to fetch DL-XVideo."); }
});
registerPlugin('statics', async (ctx) => {
  const stats = getBotStats(ctx);
  await sendBannerMenu(ctx, `👥 Users: ${stats.users}\nPlugins: ${stats.plugins}\nRAM: ${stats.memory}\nUptime: ${stats.uptime}\nVersion: ${stats.version}`);
});
registerPlugin('listusers', async (ctx) => {
  await sendBannerMenu(ctx, `Users:\n${[...botStats.users].join('\n')}`);
});
registerPlugin('logs', async (ctx) => {
  await sendBannerMenu(ctx, `📝 Logs: (not implemented, example only)`);
});
registerPlugin('setbanner', async (ctx, args) => {
  if (ctx.from.id.toString() !== OWNER_ID) return sendBannerMenu(ctx, "❌ Only owner can use this.");
  if (!args[0]) return sendBannerMenu(ctx, "❌ Provide an image url.");
  bannerUrl = args[0];
  await sendBannerMenu(ctx, "✅ Banner updated.");
});
registerPlugin('setprefix', async (ctx, args) => {
  if (ctx.from.id.toString() !== OWNER_ID) return sendBannerMenu(ctx, "❌ Only owner can use this.");
  if (!args.length) return sendBannerMenu(ctx, "❌ Provide prefixes.");
  prefix = args;
  await sendBannerMenu(ctx, "✅ Prefix updated.");
});
registerPlugin('setbotname', async (ctx, args) => {
  if (ctx.from.id.toString() !== OWNER_ID) return sendBannerMenu(ctx, "❌ Only owner can use this.");
  if (!args[0]) return sendBannerMenu(ctx, "❌ Provide a name.");
  botName = args.join(' ');
  await sendBannerMenu(ctx, "✅ Bot name updated.");
});
registerPlugin('broadcast', async (ctx, args) => {
  if (ctx.from.id.toString() !== OWNER_ID) return sendBannerMenu(ctx, "❌ Only owner can use this.");
  let msg = args.join(' ') || "No message";
  let failed = [];
  for (const userId of botStats.users) {
    try {
      await bot.telegram.sendPhoto(userId, bannerUrl, {
        caption: msg,
        ...menuButtons()
      });
    } catch (e) { failed.push(userId); }
  }
  await sendBannerMenu(ctx, `✅ Broadcast sent.\nFailed: ${failed.length}`);
});
registerPlugin('restart', async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return sendBannerMenu(ctx, "❌ Only owner can use this.");
  const stats = getBotStats(ctx);
  await sendBannerMenu(ctx, `♻️ Bot Restarted!\nVersion: ${stats.version}\nUptime: ${stats.uptime}\nRAM: ${stats.memory}\nUsers: ${stats.users}\nOwner: ${stats.owner}\nTime: ${stats.time_now}\nDate: ${stats.date_now}`);
  process.exit(0); // Let Render/Termux restart (or use pm2 if desired)
});

// -------- CORE COMMAND HANDLER -------- //
function parseCommand(text) {
  for (const pfx of prefix) {
    if (text.startsWith(pfx)) {
      let sliced = text.slice(pfx.length).trim();
      let cmd = sliced.split(' ')[0].toLowerCase();
      let args = sliced.split(' ').slice(1);
      return { cmd, args };
    }
  }
  return null;
}

bot.on('text', async ctx => {
  let txt = ctx.message.text;
  let command = parseCommand(txt);
  if (
    ['/start', '/menu', '.start', '.menu', '.bot'].includes(txt.trim().toLowerCase())
    || (command && ['menu', 'bot'].includes(command.cmd))
  ) {
    return sendBannerMenu(ctx);
  }
  if (!command) return;
  if (plugins[command.cmd]) {
    try {
      await plugins[command.cmd](ctx, command.args);
    } catch {
      await sendBannerMenu(ctx, "❌ Error in plugin.");
    }
  }
});

bot.on('new_chat_members', async ctx => {
  await sendBannerMenu(ctx, `👋 Welcome, ${ctx.message.new_chat_members.map(u => u.first_name).join(', ')}!`);
});
bot.on('message', async ctx => {
  if (!ctx.message.text) await sendBannerMenu(ctx, "👋 I only respond to commands. Use /menu");
});

// KEEP ALIVE FOR RENDER
if (process.env.RENDER) {
  require('http').createServer((req, res) => {
    res.end('CYBIX BOT IS RUNNING.');
  }).listen(PORT, () => {
    console.log(`[INFO] Web server running on port ${PORT}`);
  });
}

// LAUNCH BOT
bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log("[INFO] CYBIX Bot started!");
}).catch(err => {
  console.error("[ERROR] Bot launch failed:", err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));