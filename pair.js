const PastebinAPI = require('pastebin-js'),
pastebin = new PastebinAPI('EMWTMkQAVfJa9k-MRUrxd5Oku1U7pgL')
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: VOX_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("maher-zubair-baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function VOX_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

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
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_VOX_Tech.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Pair_Code_By_VOX_Tech.ev.on('creds.update', saveCreds);
            Pair_Code_By_VOX_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(5000);
                    let data = fs.readFileSync(`${__dirname}/temp/${id}/creds.json`);
                    await delay(800);
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
✅ *Welcome to VOX-MD-BOT!*  
🔹 _Your session has been successfully connected._  
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
                    await removeFile('./temp/' + id);

                    console.log("✅ Session connected. Restarting server...");
                    await delay(3000);
                    process.exit(1);  // 🔄 Restart the server
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    VOX_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("⚠️ Service restarted due to an error.");
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    return await VOX_MD_PAIR_CODE();
});

module.exports = router;
