require('dotenv').config();
const fs = require('fs');

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  OWNER_ID: process.env.OWNER_ID,
  TG_CHANNEL: 'https://t.me/cybixtech',
  WA_CHANNEL: 'https://whatsapp.com/channel/0029VbB8svo65yD8WDtzwd0X',
  FORCE_CHANNEL: '@cybixtech',
  VERSION: '1.0.0'
};

let prefix = process.env.PREFIX || '.';
let banner = 'https://files.catbox.moe/7dozqn.jpg';
let botName = '𝐂𝐘𝐁𝐈𝐗 𝐕1';
const devMenu = [
  'setprefix', 'setbanner', 'setbotname', 'broadcast', 'statics', 'mode', 'logs', 'info'
];

// User/channel member storage
function addUser(id) {
  let users = {};
  try { users = JSON.parse(fs.readFileSync('./users.json', 'utf8')); } catch {}
  users[id] = true;
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}
function addChannelMember(id) {
  let members = {};
  try { members = JSON.parse(fs.readFileSync('./channel_members.json', 'utf8')); } catch {}
  members[id] = true;
  fs.writeFileSync('./channel_members.json', JSON.stringify(members, null, 2));
}
function isUserInChannel(id) {
  let members = {};
  try { members = JSON.parse(fs.readFileSync('./channel_members.json', 'utf8')); } catch {}
  return !!members[id];
}

function getPrefix() { return prefix; }
function setPrefix(s) { prefix = s; }
function getBanner() { return banner; }
function setBanner(s) { banner = s; }
function getBotName() { return botName; }
function setBotName(s) { botName = s; }
function isOwner(id) { return String(id) === String(config.OWNER_ID); }
function getDevMenu() { return devMenu; }

module.exports = {
  config,
  getPrefix, setPrefix,
  getBanner, setBanner,
  getBotName, setBotName,
  isOwner,
  getDevMenu,
  addUser,
  isUserInChannel,
  addChannelMember
};