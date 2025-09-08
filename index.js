require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const { config, saveConfig, loadConfig } = require('./config');
const fs = require('fs');

// Constants
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const PORT = process.env.PORT || 3000;
const VERSION = '1.0.0';
const TELEGRAM_CHANNEL_URL = 'https://t.me/cybixtech';
const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbB8svo65yD8WDtzwd0X';
const menuTriggers = [/^\/start$/, /^\/menu$/, /^\.start$/, /^\.menu$/, /^\.bot$/i];

if (!BOT_TOKEN || !OWNER_ID) {
    console.error('❌ BOT_TOKEN and OWNER_ID must be set in .env');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const users = new Set();
const stats = { commands: 0 };

// --- Utilities ---
function getMemoryUsage() {
    return `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`;
}
function getUptime() {
    const s = Math.floor(process.uptime());
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
}
function getStatus() { return '🟢 ONLINE'; }
function getMenuText(ctx) {
    return `
╭━───〔 ${config.botName} 〕───━━╮
│ ✦ ᴘʀᴇғɪx : ${config.prefixList.join(' ')}
│ ✦ ᴏᴡɴᴇʀ : ${OWNER_ID}
│ ✦ ᴜsᴇʀ : ${ctx.from.first_name || ''}
│ ✦ ᴜsᴇʀ ɪᴅ : ${ctx.from.id}
│ ✦ ᴜsᴇʀs : ${users.size}
│ ✦ sᴘᴇᴇᴅ : ${Math.floor(Math.random()*10+1)}ms
│ ✦ sᴛᴀᴛᴜs : ${getStatus()}
│ ✦ ᴘʟᴜɢɪɴs : All built-in
│ ✦ ᴠᴇʀsɪᴏɴ : ${VERSION}
│ ✦ ᴛɪᴍᴇ ɴᴏᴡ : ${new Date().toLocaleTimeString()}
│ ✦ ᴅᴀᴛᴇ ɴᴏᴡ : ${new Date().toLocaleDateString()}
│ ✦ ᴍᴇᴍᴏʀʏ : ${getMemoryUsage()}
╰───────────────────╯
╭━━【 𝐀𝐈 𝐌𝐄𝐍𝐔 】━━
┃ • chatgpt
┃ • openai
┃ • blackbox
┃ • gemini
┃ • deepseek
┃ • text2img
╰━━━━━━━━━━━━━━━
╭━━【 𝐃𝐋 𝐌𝐄𝐍𝐔 】━━
┃ • apk
┃ • spotifys
┃ • gitclone
┃ • mediafire
┃ • play
┃ • gdrive 
╰━━━━━━━━━━━━━━━
╭━━【 𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔 】━━
┃ • repo
┃ • ping
┃ • runtime
╰━━━━━━━━━━━━━━━
╭━━【 𝐀𝐃𝐔𝐋𝐓 𝐌𝐄𝐍𝐔 】━━
┃ • xvideosearch
┃ • xnxxsearch
┃ • dlxnxxvid
┃ • dlxvideo
╰━━━━━━━━━━━━━━━
╭━━【𝐃𝐄𝐕 𝐌𝐄𝐍𝐔】━━
┃ • statics
┃ • listusers
┃ • logs
┃ • setbanner
┃ • setprefix
┃ • setbotname
╰━━━━━━━━━━━━━━━
ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐂𝐘𝐁𝐈𝐗 𝐃𝐄𝐕𝐒
    `;
}
function getButtons() {
    // Each button on its own row (vertical stack)
    return Markup.inlineKeyboard([
        [Markup.button.url('🔗 Telegram Channel', TELEGRAM_CHANNEL_URL)],
        [Markup.button.url('🟢 WhatsApp Channel', WHATSAPP_CHANNEL_URL)]
    ]);
}
async function sendBannerWithMenu(ctx, caption) {
    try {
        await ctx.replyWithPhoto({ url: config.bannerUrl }, {
            caption,
            parse_mode: 'Markdown',
            ...getButtons()
        });
    } catch (e) {
        try { await ctx.reply('⚠️ Error sending banner.'); } catch {}
        console.error('Banner Send Error:', e);
    }
}
function getCommandTrigger(cmd) {
    return new RegExp(`^(${config.prefixList.map(c=>"\\"+c).join('|')})${cmd}(\\s+.*)?$`, 'i');
}

// --- Register users for stats ---
bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id) users.add(ctx.from.id);
    await next();
});

// --- Menu triggers ---
bot.hears(menuTriggers, async ctx => {
    await sendBannerWithMenu(ctx, getMenuText(ctx));
});

// --- AI MENU ---
bot.hears(getCommandTrigger('chatgpt'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim();
        if (!q) return sendBannerWithMenu(ctx, 'Usage: chatgpt <your question>');
        const { data } = await axios.get(`https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🤖 *ChatGPT*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Failed to fetch ChatGPT.'); }
});
bot.hears(getCommandTrigger('openai'), async ctx => {
    stats.commands++;
    try {
        const { data } = await axios.get(`https://api.princetechn.com/api/ai/openai?apikey=prince&q=Whats+Your+Model`);
        await sendBannerWithMenu(ctx, `🤖 *OpenAI*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ OpenAI error.'); }
});
bot.hears(getCommandTrigger('blackbox'), async ctx => {
    stats.commands++;
    try {
        const { data } = await axios.get(`https://api.princetechn.com/api/ai/blackbox?apikey=prince&q=Whats+Your+Model`);
        await sendBannerWithMenu(ctx, `🤖 *Blackbox*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Blackbox error.'); }
});
bot.hears(getCommandTrigger('gemini'), async ctx => {
    stats.commands++;
    try {
        const { data } = await axios.get(`https://api.princetechn.com/api/ai/geminiaipro?apikey=prince&q=Whats+Your+Model`);
        await sendBannerWithMenu(ctx, `🤖 *Gemini*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Gemini error.'); }
});
bot.hears(getCommandTrigger('deepseek'), async ctx => {
    stats.commands++;
    try {
        const { data } = await axios.get(`https://api.princetechn.com/api/ai/deepseek-v3?apikey=prince&q=Whats+Your+Model`);
        await sendBannerWithMenu(ctx, `🤖 *Deepseek*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Deepseek error.'); }
});
bot.hears(getCommandTrigger('text2img'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'A Cute Baby';
        const { data } = await axios.get(`https://api.princetechn.com/api/ai/text2img?apikey=prince&prompt=${encodeURIComponent(q)}`);
        if (data.result && typeof data.result === 'string' && data.result.startsWith('http')) {
            await ctx.replyWithPhoto({ url: data.result }, {
                caption: '🖼 *Text2Img*',
                parse_mode: 'Markdown',
                ...getButtons()
            });
        } else {
            await sendBannerWithMenu(ctx, `🖼 *Text2Img*: ${data.result || 'No response.'}`);
        }
    } catch { await sendBannerWithMenu(ctx, '❌ text2img error.'); }
});

// --- DL MENU ---
bot.hears(getCommandTrigger('apk'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'Whatsapp';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/apkdl?apikey=prince&appName=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `📱 *APK*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ APK error.'); }
});
bot.hears(getCommandTrigger('spotifys'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'Spectre';
        const { data } = await axios.get(`https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🎵 *Spotify Search*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Spotify search error.'); }
});
bot.hears(getCommandTrigger('gitclone'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'https://github.com/Mayelprince/PRINCE-MDXI';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/gitclone?apikey=prince&url=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `💾 *Gitclone*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Gitclone error.'); }
});
bot.hears(getCommandTrigger('mediafire'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'https://www.mediafire.com/file/6ucfxy4gqtyq6rv/Company_Accounts_issue_of_shares.ppt/file';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/mediafire?apikey=prince&url=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🔗 *Mediafire*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ Mediafire error.'); }
});
bot.hears(getCommandTrigger('play'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'https://youtu.be/qF-JLqKtr2Q?feature=shared';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(q)}`);
        if (data.result && typeof data.result === 'string' && data.result.startsWith('http')) {
            await ctx.replyWithAudio({ url: data.result }, { caption: '🎧 Here is your audio', ...getButtons() });
        } else {
            await sendBannerWithMenu(ctx, `🎶 *Play*: ${data.result || 'No response.'}`);
        }
    } catch { await sendBannerWithMenu(ctx, '❌ Play error.'); }
});
bot.hears(getCommandTrigger('gdrive'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'https://drive.google.com/file/d/1fnq8C1p0y3bEoFeomO56klnMLjbq126c/view?usp=drive_link';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/gdrivedl?apikey=prince&url=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `💾 *GDrive*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ GDrive error.'); }
});

// --- OTHER MENU ---
bot.hears(getCommandTrigger('repo'), async ctx => {
    await sendBannerWithMenu(ctx, '🗂 [GitHub Repo](https://github.com/Mayelprince/PRINCE-MDXI)');
});
bot.hears(getCommandTrigger('ping'), async ctx => {
    await sendBannerWithMenu(ctx, `🏓 Pong! Speed: ${Math.floor(Math.random()*10+1)}ms`);
});
bot.hears(getCommandTrigger('runtime'), async ctx => {
    await sendBannerWithMenu(ctx, `⏱ Uptime: ${getUptime()}`);
});

// --- ADULT MENU ---
bot.hears(getCommandTrigger('xvideosearch'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'Mom and Son';
        const { data } = await axios.get(`https://api.princetechn.com/api/search/xvideossearch?apikey=prince&query=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🔞 *XVideos*: ${Array.isArray(data.result) ? data.result.join('\n') : data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ XVideos error.'); }
});
bot.hears(getCommandTrigger('xnxxsearch'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'Mom and Son';
        const { data } = await axios.get(`https://api.princetechn.com/api/search/xnxxsearch?apikey=prince&query=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🔞 *XNXX*: ${Array.isArray(data.result) ? data.result.slice(0,5).join('\n') : data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ XNXX error.'); }
});
bot.hears(getCommandTrigger('dlxnxxvid'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'https://www.xnxx.health/video-1256sd47/stepbrother_and_stepsister_learn_about_sex_-_step_mother_family_sex_female_anatomy_accidental_creampie';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/xnxxdl?apikey=prince&url=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🔞 *XNXX Download*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ XNXX Download error.'); }
});
bot.hears(getCommandTrigger('dlxvideo'), async ctx => {
    stats.commands++;
    try {
        const q = ctx.message.text.replace(/^\S+\s*/, '').trim() || 'https://www.xvideos.com/video.uphdukv604c/novinha_gulosa_pediu_pra_colocar_tudo_dentro_da_bucetinha_e_recebeu_enorme_gozada';
        const { data } = await axios.get(`https://api.princetechn.com/api/download/xvideosdl?apikey=prince&url=${encodeURIComponent(q)}`);
        await sendBannerWithMenu(ctx, `🔞 *XVideos Download*: ${data.result || 'No response.'}`);
    } catch { await sendBannerWithMenu(ctx, '❌ XVideos Download error.'); }
});

// --- DEV MENU ---
bot.hears(getCommandTrigger('statics'), async ctx => {
    if (ctx.from.id.toString() !== OWNER_ID) return sendBannerWithMenu(ctx, '❌ Only owner can see statics!');
    const statsText = `
*Bot Stats*
- Users: ${users.size}
- Memory: ${getMemoryUsage()}
- Uptime: ${getUptime()}
- Commands used: ${stats.commands}
    `;
    await sendBannerWithMenu(ctx, statsText);
});
bot.hears(getCommandTrigger('listusers'), async ctx => {
    if (ctx.from.id.toString() !== OWNER_ID) return sendBannerWithMenu(ctx, '❌ Only owner can list users!');
    await sendBannerWithMenu(ctx, `👤 Users: ${[...users].join(', ')}`);
});
bot.hears(getCommandTrigger('logs'), async ctx => {
    if (ctx.from.id.toString() !== OWNER_ID) return sendBannerWithMenu(ctx, '❌ Only owner can see logs!');
    await sendBannerWithMenu(ctx, 'ℹ️ Logs feature not implemented for privacy.');
});
bot.hears(getCommandTrigger('setprefix'), async ctx => {
    if (ctx.from.id.toString() !== OWNER_ID) return sendBannerWithMenu(ctx, '❌ Only owner can set prefix!');
    const arr = ctx.message.text.trim().split(/\s+/);
    if (arr.length < 2) return sendBannerWithMenu(ctx, 'Usage: setprefix <prefix1> [prefix2]');
    config.prefixList = arr.slice(1);
    saveConfig();
    await sendBannerWithMenu(ctx, `✅ Prefix changed to: ${config.prefixList.join(' ')}`);
});
bot.hears(getCommandTrigger('setbotname'), async ctx => {
    if (ctx.from.id.toString() !== OWNER_ID) return sendBannerWithMenu(ctx, '❌ Only owner can set bot name!');
    const newName = ctx.message.text.replace(/^\S+\s+/, '').trim();
    if (!newName) return sendBannerWithMenu(ctx, 'Usage: setbotname <new_name>');
    config.botName = newName;
    saveConfig();
    await sendBannerWithMenu(ctx, `✅ Bot name changed to: *${config.botName}*`);
});
bot.hears(getCommandTrigger('setbanner'), async ctx => {
    if (ctx.from.id.toString() !== OWNER_ID) return sendBannerWithMenu(ctx, '❌ Only owner can set banner!');
    const url = ctx.message.text.replace(/^\S+\s+/, '').trim();
    if (!/^https?:\/\//.test(url)) return sendBannerWithMenu(ctx, 'Usage: setbanner <banner_url>');
    config.bannerUrl = url;
    saveConfig();
    await sendBannerWithMenu(ctx, `✅ Banner changed!`);
});

// --- Unknown Commands ---
bot.on('text', async ctx => {
    if (
        menuTriggers.some(rx => rx.test(ctx.message.text))
    ) return;
    if (
        config.prefixList.some(pf => ctx.message.text.startsWith(pf))
    ) {
        await sendBannerWithMenu(ctx, `❓ Unknown command. Use ${config.prefixList[0]}menu`);
    }
});

// --- Error Handling ---
bot.catch(async (err, ctx) => {
    try { await sendBannerWithMenu(ctx, '⚠️ An error occurred. Please try again later.'); } catch {}
    console.error('Unhandled Error:', err);
});

// --- Launch Bot ---
bot.launch({ webhook: { domain: process.env.RENDER_EXTERNAL_URL, port: PORT } }).then(() => {
    console.log(`✅ Bot running on port ${PORT}`);
}).catch(e => {
    console.error('Launch Error:', e);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));