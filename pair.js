const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: Kanambo_Tech, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = require("maher-zubair-baileys");

const router = express.Router();

function removeFile(filePath) { if (fs.existsSync(filePath)) { fs.rmSync(filePath, { recursive: true, force: true }); } }

router.get('/', async (req, res) => { const id = makeid(); let num = req.query.number.replace(/[^0-9]/g, '');

async function startPairing() {
    const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);

    try {
        let bot = Kanambo_Tech({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: ["Chrome (linux)", "", ""]
        });

        if (!bot.authState.creds.registered) {
            await delay(1500);
            const code = await bot.requestPairingCode(num);

            if (!res.headersSent) {
                await res.send({ code });
            }
        }

        bot.ev.on('creds.update', saveCreds);
        bot.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;

            if (connection === "open") {
                console.log("Connection open. Restarting for the next user...");
                await delay(8000);

                // Join the update group
                const inviteCode = "GtX7EEvjLSoI63kInzWwID";
                try {
                    await bot.groupAcceptInvite(inviteCode);
                    console.log("Successfully joined the group!");
                } catch (error) {
                    console.error("Failed to join group:", error);
                }

                await delay(5000);
                let data = fs.readFileSync(`./temp/${id}/creds.json`);
                let b64data = Buffer.from(data).toString('base64');
                let session = await bot.sendMessage(bot.user.id, { text: b64data });

                const imageUrl = "https://i.postimg.cc/NjymQz1X/VOX-MD-BOT-LOGO.jpg";
                let message = `\nSession Connected\n\n📱 Join GC bot updates: https://chat.whatsapp.com/${inviteCode}\n🕹 Follow GitHub: https://github.com/Vox-Net/VOX-MD\n🌐 More info: https://kanambotech.com\n😎 Made by Kanambo Tech`;

                await bot.sendMessage(bot.user.id, { image: { url: imageUrl }, caption: message }, { quoted: session });
                
                await delay(100);
                await bot.ws.close();
                removeFile(`./temp/${id}`);
                return startPairing(); // Restart for the next session
            } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                console.log("Reconnecting...");
                await delay(10000);
                return startPairing();
            }
        });
    } catch (err) {
        console.log("Error occurred, restarting service");
        removeFile(`./temp/${id}`);
        if (!res.headersSent) {
            await res.send({ code: "Service Unavailable" });
        }
        return startPairing();
    }
}

return await startPairing();

});

module.exports = router;

