require('dotenv').config();
const PastebinAPI = require('pastebin-js'),
    pastebin = new PastebinAPI('EMWTMkQAVfJa9k-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const {
    default: VOX_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("maher-zubair-baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    if (!num) {
        return res.status(400).send({ error: "❌ Phone number is required! Example: ?number=254114148625" });
    }

    num = num.replace(/[^0-9]/g, '');
    const id = `session_${num}`; // 🔹 Unique session for each number

    async function VOX_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);

        try {
            let Pair_Code_By_VOX_Tech = VOX_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Chrome (Linux)", "", ""]
            });

            if (!Pair_Code_By_VOX_Tech.authState.creds.registered) {
                await delay(1500);
                const code = await Pair_Code_By_VOX_Tech.requestPairingCode(num);

                console.log(`✅ Pairing Code for ${num}:`, code);

                if (!res.headersSent) {
                    res.send({ status: "success", number: num, code });
                }

                if (req.headers['user-agent'] && req.headers['user-agent'].includes("VOX-BOT")) {
                    await Pair_Code_By_VOX_Tech.sendMessage(Pair_Code_By_VOX_Tech.user.id, { text: `✅ Your Pairing Code for ${num}: ${code}` });
                }
            }

            Pair_Code_By_VOX_Tech.ev.on('creds.update', saveCreds);
            Pair_Code_By_VOX_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(5000);
                    let data = fs.readFileSync(`${__dirname}/temp/${id}/creds.json`);
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await Pair_Code_By_VOX_Tech.sendMessage(Pair_Code_By_VOX_Tech.user.id, { text: '' + b64data });

                    let VOX_MD_TEXT = `
╭━━━━━━━━━━━━━━━━━━━━━━━╮  
┃🚀 *SESSION CONNECTED!* 🚀  
╰━━━━━━━━━━━━━━━━━━━━━━━╯  

🎯 *Bot Name:*  𝗩𝗢𝗫-𝗠𝗗-𝗕𝗢𝗧  
👑 *Owner:*  [𝗞𝗔𝗡𝗔𝗠𝗕𝗢](https://wa.me/+254114148625)  
💻 *GitHub Repo:*  [VOX-MD on GitHub](https://github.com/Vox-Net/VOX-MD)  
🌍 *WhatsApp Group:* https://chat.whatsapp.com/EZaBQvil8qT9JrI2aa1MAE

━━━━━━━━━━━━━━━━━━━━━━━  
✅ *Your session has been successfully connected for:*  
📞 *Number:* ${num}  
🔹 _Keep your session secure and do not share it._  
━━━━━━━━━━━━━━━━━━━━━━━  

🌟 *Enjoy using VOX-MD-BOT!* 🌟  

╭━━━━━━━━━━━━━━━━━━━━━━━╮  
┃🚀 *Powered by:* **© 𝗩𝗢𝗫𝗡𝗘𝗧.𝗜𝗡𝗖.**  
╰━━━━━━━━━━━━━━━━━━━━━━━╯  
`;

                    await Pair_Code_By_VOX_Tech.sendMessage(Pair_Code_By_VOX_Tech.user.id, { text: VOX_MD_TEXT }, { quoted: session });

                    await delay(100);
                    await Pair_Code_By_VOX_Tech.ws.close();
                    await removeFile(`./temp/${id}`);

                    console.log(`✅ Session for ${num} connected. Restarting server...`);
                    await delay(3000);
                    process.exit(1);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    VOX_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log(`⚠️ Service restarted due to an error for ${num}:`, err.message);
            await removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                return res.send({ error: "Service Unavailable", details: err.message });
            }
        }
    }

    return await VOX_MD_PAIR_CODE();
});

module.exports = router;