const fs = require('fs');
const CONFIG_PATH = './config.json';

const defaultConfig = {
    prefixList: ['.', '/'],
    botName: 'CYBIX V1',
    bannerUrl: 'https://files.catbox.moe/7dozqn.jpg'
};

let config = { ...defaultConfig };

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('Config Save Error:', e);
    }
}
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const conf = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            Object.assign(config, conf);
        }
    } catch (e) {
        console.error('Config Load Error:', e);
    }
}

loadConfig();

module.exports = {
    config,
    saveConfig,
    loadConfig,
    defaultConfig
};