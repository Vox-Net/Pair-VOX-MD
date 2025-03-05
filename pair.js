const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");

const {
    default: VOX_MD_BOT,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("maher-zubair-baileys");

const router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    const sessionPath = `./temp/${id}`;

    async function START_VOX_MD_PAIRING() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        try {
            let Pairing_Session = VOX_MD_BOT({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["VOX-MD-BOT (Linux)", "", ""]
            });

            if (!Pairing_Session.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pairing_Session.requestPairingCode(num);
                
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Pairing_Session.ev.on('creds.update', saveCreds);

            Pairing_Session.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000);
                    let data = fs.readFileSync(`${sessionPath}/creds.json`);
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');

                    let sessionMessage = await Pairing_Session.sendMessage(
                        Pairing_Session.user.id,
                        { text: '' + b64data }
                    );

                    let VOX_MD_MESSAGE = `
╔════════════════════════╗
║   🌟 *SESSION CONNECTED* 🌟   
╚════════════════════════╝
  
💠 *Bot Name:*  VOX-MD-BOT  
💠 *Owner:*  [KANAMBO](https://wa.me/+254114148625)  
💠 *GitHub Repo:*  [VOX-MD](https://github.com/Vox-Net/VOX-MD)  
💠 *WhatsApp Group:*  [Join Now](https://chat.whatsapp.com/FF6YuOZTAVB6Lu65cnY5BN)  

📌 _You've successfully connected to VOX-MD-BOT!_
📌 _Please do not share this session for security reasons._

⚠ *This session will expire automatically to prevent continuous reconnections.*  

╔════════════════════════╗
  🚀 *Powered by ©VOXNET.INC*  
╚════════════════════════╝`;

                    await Pairing_Session.sendMessage(Pairing_Session.user.id, { text: VOX_MD_MESSAGE }, { quoted: sessionMessage });

                    // Expire session after successful connection
                    await delay(100);
                    await Pairing_Session.ws.close();
                    return removeFile(sessionPath);
                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    START_VOX_MD_PAIRING();
                }
            });

            // Automatically delete expired session after a set time
            setTimeout(() => {
                removeFile(sessionPath);
            }, 60000); // Session expires after 60 seconds

        } catch (err) {
            console.log("Service Restarted");
            removeFile(sessionPath);

            if (!res.headersSent) {
                res.send({ code: "Service Unavailable" });
            }
        }
    }

    return START_VOX_MD_PAIRING();
});

module.exports = router;
