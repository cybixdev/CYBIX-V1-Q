require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const {
  config,
  isOwner,
  getPrefix, setPrefix,
  setBanner, getBanner,
  setBotName, getBotName,
  getDevMenu,
  addUser, isUserInChannel, addChannelMember
} = require('./config');
const { getNextEmoji } = require('./reactions');

// --- Force Join Middleware ---
botForceJoin: (() => {
  let checkedUsers = {};
  return async (ctx, next) => {
    if (!ctx.from?.id || ctx.chat.type !== 'private' || isOwner(ctx.from.id)) return next();
    if (checkedUsers[ctx.from.id]) return next();
    try {
      const member = await ctx.telegram.getChatMember(config.FORCE_CHANNEL, ctx.from.id);
      if (['member', 'administrator', 'creator'].includes(member.status)) {
        addChannelMember(ctx.from.id);
        checkedUsers[ctx.from.id] = true;
        return next();
      } else {
        await ctx.replyWithPhoto(
          { url: getBanner() },
          {
            caption: `❌ You must join [CYBIXTECH Channel](${config.TG_CHANNEL}) first to use this bot!`,
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.url('Join Channel', config.TG_CHANNEL)],
              [Markup.button.url('Contact Owner', config.WA_CHANNEL)]
            ])
          }
        );
      }
    } catch (e) {
      await ctx.replyWithPhoto(
        { url: getBanner() },
        {
          caption: `❌ You must join [CYBIXTECH Channel](${config.TG_CHANNEL}) first to use this bot!`,
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.url('Join Channel', config.TG_CHANNEL)],
            [Markup.button.url('Contact Owner', config.WA_CHANNEL)]
          ])
        }
      );
    }
  };
})();

// --- Bot/Telegraf Instance ---
const bot = new Telegraf(config.BOT_TOKEN, { handlerTimeout: 24000 });
bot.use(botForceJoin); // Always check for channel membership

// --- Auto Reactor Middleware ---
bot.use(async (ctx, next) => {
  await next();
  let mid = ctx.message?.message_id || ctx.update?.message?.message_id || ctx.update?.callback_query?.message?.message_id;
  if (mid) {
    try {
      await ctx.telegram.sendMessage(ctx.chat.id, getNextEmoji(), { reply_to_message_id: mid });
    } catch (e) {}
  }
});

// --- Banner/buttons sender ---
async function sendBanner(ctx, caption) {
  const m = await ctx.replyWithPhoto(
    { url: getBanner() },
    {
      caption: caption || genMenuCaption(ctx),
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url('Telegram Channel', config.TG_CHANNEL)],
        [Markup.button.url('WhatsApp Channel', config.WA_CHANNEL)]
      ])
    }
  );
  if (m?.message_id) {
    try { await ctx.telegram.sendMessage(ctx.chat.id, getNextEmoji(), { reply_to_message_id: m.message_id }); } catch (e) {}
  }
}

// --- Menu Caption (original structure, fully preserved) ---
function genMenuCaption(ctx) {
  const user = ctx.from?.first_name || 'Unknown';
  const userId = ctx.from?.id || 'Unknown';
  const speed = `${Math.random().toFixed(3)}s`;
  const now = new Date();
  const timeNow = now.toLocaleTimeString();
  const dateNow = now.toLocaleDateString();
  const memory = `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;
  return `
╭━───〔 𝐂𝐘𝐁𝐈𝐗 𝐕1 〕───━━╮
│ ✦ ᴘʀᴇғɪx : ${getPrefix()}
│ ✦ ᴏᴡɴᴇʀ : ${config.OWNER_ID}
│ ✦ ᴜsᴇʀ : ${user}
│ ✦ ᴜsᴇʀ ɪᴅ : ${userId}
│ ✦ sᴘᴇᴇᴅ : ${speed}
│ ✦ sᴛᴀᴛᴜs : Online
│ ✦ ᴘʟᴜɢɪɴs : all
│ ✦ ᴠᴇʀsɪᴏɴ : ${config.VERSION}
│ ✦ ᴛɪᴍᴇ ɴᴏᴡ : ${timeNow}
│ ✦ ᴅᴀᴛᴇ ɴᴏᴡ : ${dateNow}
│ ✦ ᴍᴇᴍᴏʀʏ : ${memory}
╰───────────────────╯
╭━━【 𝐀𝐈 𝐌𝐄𝐍𝐔 】━━
┃ • chatgpt
┃ • openai
┃ • blackbox
┃ • gemini
┃ • deepseek
┃ • text2img
╰━━━━━━━━━━━━━━━
╭━━【 𝐅𝐔𝐍 𝐌𝐄𝐍𝐔 】━━
┃ • joke
┃ • meme
┃ • waifu
┃ • dare
┃ • truth
╰━━━━━━━━━━━━━━━
╭━━【 𝐓𝐎𝐎𝐋𝐒 𝐌𝐄𝐍𝐔 】━━
┃ • obfuscator
┃ • calc
┃ • img2url
┃ • tinyurl
┃ • tempmail
┃ • fancy
╰━━━━━━━━━━━━━━━
╭━━【 𝐒𝐄𝐀𝐑𝐂𝐇 𝐌𝐄𝐍𝐔 】━━
┃ • lyrics
┃ • spotify-s
┃ • yts
┃ • wallpaper
┃ • weather
┃ • google
╰━━━━━━━━━━━━━━━
╭━━【 𝐃𝐋 𝐌𝐄𝐍𝐔 】━━
┃ • apk
┃ • spotify
┃ • gitclone
┃ • mediafire
┃ • play
┃ • ytmp4
┃ • gdrive
┃ • docdl
╰━━━━━━━━━━━━━━━
╭━━【 𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔 】━━
┃ • repo
┃ • ping
┃ • runtime
┃ • developer
┃ • buybot
╰━━━━━━━━━━━━━━━
╭━━【 𝐀𝐃𝐔𝐋𝐓 𝐌𝐄𝐍𝐔 】━━
┃ • xvideosearch
┃ • xnxxsearch
┃ • dl-xnxx
┃ • dl-xvideo
┃ • boobs
┃ • ass
┃ • nudes
┃ • pornpic
┃ • pornvid
╰━━━━━━━━━━━━━━━
╭━━【𝐃𝐄𝐕 𝐌𝐄𝐍𝐔】━━
${getDevMenu().map(c => `┃ • ${c}`).join('\n')}
╰━━━━━━━━━━━━━━━

ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐂𝐘𝐁𝐈𝐗 𝐃𝐄𝐕𝐒
`.trim();
}

// --- Always Banner/Buttons Middleware ---
bot.use(async (ctx, next) => {
  ctx.sendBanner = async (caption) => await sendBanner(ctx, caption);
  await next();
});

// --- Menu Commands ---
bot.hears(/^\/(start|menu|bot)$/i, async (ctx) => {
  addUser(ctx.from.id);
  await ctx.sendBanner();
});
bot.hears(new RegExp(`^(${getPrefix()})menu$`, 'i'), async (ctx) => {
  addUser(ctx.from.id);
  await ctx.sendBanner();
});

// --- Developer Commands ---
const devCmds = getDevMenu();
devCmds.forEach(cmd => {
  bot.hears(new RegExp(`^(${getPrefix()})${cmd}(?: ?(.+))?$`, 'i'), async (ctx) => {
    if (!isOwner(ctx.from.id)) return ctx.sendBanner('❌ Only owner can use this command!');
    switch (cmd) {
      case 'setprefix':
        setPrefix(ctx.match[2]?.trim() || '.');
        await ctx.sendBanner(`Prefix updated to: ${getPrefix()}`);
        break;
      case 'setbanner':
        setBanner(ctx.match[2]?.trim() || getBanner());
        await ctx.sendBanner('Banner updated!');
        break;
      case 'setbotname':
        setBotName(ctx.match[2]?.trim() || getBotName());
        await ctx.sendBanner('Bot name updated!');
        break;
      case 'broadcast':
        // Broadcast to all users in users.json
        const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
        for (let id of Object.keys(users)) {
          try {
            await bot.telegram.sendPhoto(id, { url: getBanner() }, {
              caption: `Broadcast: ${ctx.match[2]}`,
              ...Markup.inlineKeyboard([
                [Markup.button.url('Telegram Channel', config.TG_CHANNEL)],
                [Markup.button.url('WhatsApp Channel', config.WA_CHANNEL)]
              ])
            });
          } catch (e) {}
        }
        await ctx.sendBanner('Broadcast sent!');
        break;
      case 'statics':
        await ctx.sendBanner(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        break;
      case 'mode':
        await ctx.sendBanner('Mode: Public');
        break;
      case 'logs':
        await ctx.sendBanner('No logs available.');
        break;
      case 'info':
        await ctx.sendBanner(`Bot version: ${config.VERSION}`);
        break;
      default:
        await ctx.sendBanner('Dev command executed.');
    }
  });
});

// --- Plugins (all commands, robust error handling, original prefix logic) ---
// AI MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?chatgpt( .+)?$`, 'i'), async (ctx) => {
  const q = ctx.match[2]?.trim() || 'Hello!';
  try {
    const url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(q)}`;
    const res = await axios.get(url);
    await ctx.sendBanner(res.data?.result || 'No response');
  } catch { await ctx.sendBanner('ChatGPT error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?openai( .+)?$`, 'i'), async (ctx) => {
  try {
    const url = `https://api.princetechn.com/api/ai/openai?apikey=prince&q=Whats+Your+Model`;
    const res = await axios.get(url);
    await ctx.sendBanner(res.data?.result || 'No response');
  } catch { await ctx.sendBanner('OpenAI error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?blackbox( .+)?$`, 'i'), async (ctx) => {
  try {
    const url = `https://api.princetechn.com/api/ai/blackbox?apikey=prince&q=Whats+Your+Model`;
    const res = await axios.get(url);
    await ctx.sendBanner(res.data?.result || 'No response');
  } catch { await ctx.sendBanner('Blackbox error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?gemini( .+)?$`, 'i'), async (ctx) => {
  try {
    const url = `https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q=Whats+Your+Model`;
    const res = await axios.get(url);
    await ctx.sendBanner(res.data?.result || 'No response');
  } catch { await ctx.sendBanner('Gemini error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?deepseek( .+)?$`, 'i'), async (ctx) => {
  try {
    const url = `https://api.princetechn.com/api/ai/deepseek-v3?apikey=prince&q=Whats+Your+Model`;
    const res = await axios.get(url);
    await ctx.sendBanner(res.data?.result || 'No response');
  } catch { await ctx.sendBanner('Deepseek error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?text2img( .+)?$`, 'i'), async (ctx) => {
  const prompt = ctx.match[2]?.trim() || 'A Cute Baby';
  try {
    const url = `https://api.princetechn.com/api/ai/text2img?apikey=prince&prompt=${encodeURIComponent(prompt)}`;
    const res = await axios.get(url);
    await ctx.sendBanner(res.data?.result || 'No response');
  } catch { await ctx.sendBanner('Text2Img error'); }
});

// FUN MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?joke$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode');
    await ctx.sendBanner(res.data?.joke || res.data?.setup + '\n' + res.data?.delivery || 'No joke found');
  } catch { await ctx.sendBanner('Joke error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?meme$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://meme-api.com/gimme');
    await ctx.sendBanner(res.data?.url || 'No meme found');
  } catch { await ctx.sendBanner('Meme error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?waifu$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://api.waifu.pics/sfw/waifu');
    await ctx.sendBanner(res.data?.url || 'No waifu found');
  } catch { await ctx.sendBanner('Waifu error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?dare$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://api.truthordarebot.xyz/v1/dare');
    await ctx.sendBanner(res.data?.question || 'No dare found');
  } catch { await ctx.sendBanner('Dare error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?truth$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://api.truthordarebot.xyz/v1/truth');
    await ctx.sendBanner(res.data?.question || 'No truth found');
  } catch { await ctx.sendBanner('Truth error'); }
});

// TOOLS MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?obfuscator (.+)$`, 'i'), async (ctx) => {
  try {
    await ctx.sendBanner('Obfuscation not supported in this demo bot.');
  } catch { await ctx.sendBanner('Obfuscator error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?calc (.+)$`, 'i'), async (ctx) => {
  try {
    const result = eval(ctx.match[2]);
    await ctx.sendBanner(`Result: ${result}`);
  } catch { await ctx.sendBanner('Calc error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?img2url$`, 'i'), async (ctx) => {
  await ctx.sendBanner('Send me an image as reply to convert to URL.');
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?tinyurl (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data || 'Failed to shorten.');
  } catch { await ctx.sendBanner('Tinyurl error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?tempmail$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
    await ctx.sendBanner(res.data?.[0] || 'No mail found.');
  } catch { await ctx.sendBanner('Tempmail error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?fancy (.+)$`, 'i'), async (ctx) => {
  await ctx.sendBanner(`***${ctx.match[2]}***`);
});

// SEARCH MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?lyrics (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(q)}`);
    await ctx.sendBanner(res.data?.result || 'No lyrics found.');
  } catch { await ctx.sendBanner('Lyrics error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?spotify-s (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${encodeURIComponent(q)}`);
    await ctx.sendBanner(res.data?.result || 'No result found.');
  } catch { await ctx.sendBanner('Spotify-s error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?yts (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/yts?apikey=prince&query=${encodeURIComponent(q)}`);
    await ctx.sendBanner(res.data?.result || 'No result found.');
  } catch { await ctx.sendBanner('YTS error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?wallpaper (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/wallpaper?apikey=prince&query=${encodeURIComponent(q)}`);
    await ctx.sendBanner(res.data?.result || 'No wallpaper found.');
  } catch { await ctx.sendBanner('Wallpaper error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?weather (.+)$`, 'i'), async (ctx) => {
  try {
    const loc = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/weather?apikey=prince&location=${encodeURIComponent(loc)}`);
    await ctx.sendBanner(res.data?.result || 'No weather found.');
  } catch { await ctx.sendBanner('Weather error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?google (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`);
    await ctx.sendBanner(res.data?.Abstract || 'No result found.');
  } catch { await ctx.sendBanner('Google error'); }
});

// DL MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?apk (.+)$`, 'i'), async (ctx) => {
  try {
    const appName = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/apkdl?apikey=prince&appName=${encodeURIComponent(appName)}`);
    await ctx.sendBanner(res.data?.result || 'No APK found.');
  } catch { await ctx.sendBanner('APK error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?spotify (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/spotifydlv2?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No result found.');
  } catch { await ctx.sendBanner('Spotify error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?gitclone (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/gitclone?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No result found.');
  } catch { await ctx.sendBanner('Gitclone error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?mediafire (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/mediafire?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No result found.');
  } catch { await ctx.sendBanner('Mediafire error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?play (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No audio found.');
  } catch { await ctx.sendBanner('Play error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?ytmp4 (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/ytmp4?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No video found.');
  } catch { await ctx.sendBanner('YTMP4 error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?gdrive (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No file found.');
  } catch { await ctx.sendBanner('GDrive error'); }
});

// OTHER MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?repo$`, 'i'), async (ctx) => {
  await ctx.sendBanner('GitHub: https://github.com/Tr0pshdbl/cybix-telegram-bot');
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?ping$`, 'i'), async (ctx) => {
  await ctx.sendBanner('Pong!');
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?runtime$`, 'i'), async (ctx) => {
  await ctx.sendBanner(`Uptime: ${process.uptime().toFixed(2)}s`);
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?developer$`, 'i'), async (ctx) => {
  await ctx.sendBanner('Owner: ' + config.OWNER_ID);
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?buybot$`, 'i'), async (ctx) => {
  await ctx.sendBanner('Contact @cybixtech for bot purchase.');
});

// ADULT MENU
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?xvideosearch (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/xvideossearch?apikey=prince&query=${encodeURIComponent(q)}`);
    await ctx.sendBanner(res.data?.result || 'No result.');
  } catch { await ctx.sendBanner('Xvideos error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?xnxxsearch (.+)$`, 'i'), async (ctx) => {
  try {
    const q = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/search/xnxxsearch?apikey=prince&query=${encodeURIComponent(q)}`);
    await ctx.sendBanner(res.data?.result || 'No result.');
  } catch { await ctx.sendBanner('XNXX error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?dl-xnxx (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/xnxxdl?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No video found.');
  } catch { await ctx.sendBanner('DL-XNXX error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?dl-xvideo (.+)$`, 'i'), async (ctx) => {
  try {
    const url = ctx.match[2];
    const res = await axios.get(`https://api.princetechn.com/api/download/xvideosdl?apikey=prince&url=${encodeURIComponent(url)}`);
    await ctx.sendBanner(res.data?.result || 'No video found.');
  } catch { await ctx.sendBanner('DL-Xvideo error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?boobs$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://api.waifu.pics/nsfw/boobs');
    await ctx.sendBanner(res.data?.url || 'No image.');
  } catch { await ctx.sendBanner('Boobs error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?ass$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://api.waifu.pics/nsfw/ass');
    await ctx.sendBanner(res.data?.url || 'No image.');
  } catch { await ctx.sendBanner('Ass error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?nudes$`, 'i'), async (ctx) => {
  await ctx.sendBanner('No public API for nudes.');
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?pornpic$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://nekobot.xyz/api/image?type=hentai');
    await ctx.sendBanner(res.data?.message || 'No image.');
  } catch { await ctx.sendBanner('Pornpic error'); }
});
bot.hears(new RegExp(`^(${getPrefix()}|\\/)?pornvid$`, 'i'), async (ctx) => {
  try {
    const res = await axios.get('https://api.redtube.com/?data=redtube.Videos.searchVideos&search=sex&output=json');
    const vid = res.data?.videos?.[0]?.video?.url || 'No video.';
    await ctx.sendBanner(vid);
  } catch { await ctx.sendBanner('Pornvid error'); }
});

// Fallback for unknown commands
bot.on('text', async (ctx, next) => {
  await next();
  if (!ctx.state.handled) await ctx.sendBanner('Unknown command! Use .menu or /menu for help.');
});

// Error handling
process.on('uncaughtException', err => console.error('Uncaught:', err));
process.on('unhandledRejection', err => console.error('Unhandled:', err));

// Keep alive for Render/Termux
const PORT = process.env.PORT || 3000;
bot.launch({ webhook: { domain: process.env.RENDER_EXTERNAL_URL, port: PORT } });
console.log(`Bot is running...`);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));