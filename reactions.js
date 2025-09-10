const emojis = [
  '🔥', '💎', '❤️', '😎', '🎉', '🌟', '🤖', '💥', '👍', '🚀', '😃', '🔥', '🌈', '👑', '✨', '📈'
];
let i = 0;
function getNextEmoji() {
  i = (i + 1) % emojis.length;
  return emojis[i];
}
module.exports = { getNextEmoji };