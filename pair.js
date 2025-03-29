const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: Kanambo_Tech, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = require("maher-zubair-baileys");

let router = express.Router();

// Function to remove a file function removeFile(FilePath) { if (!fs.existsSync(FilePath)) return false; fs.rmSync(FilePath, { recursive: true, force: true }); }

// Route for pairing router.get('/', async (req, res) => { const id = makeid(); let num = req.query.number;

async function KANAMBO_MD_PAIR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

    try {
        let Pair_Code_By_Kanambo_Tech = Kanambo_Tech({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: "fatal" }).child({ level: "fatal" })
                ),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: ["Chrome (linux)", "", ""]
        });

        if (!Pair_Code_By_Kanambo_Tech.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await Pair_Code_By_Kanambo_Tech.requestPairingCode(num);

            if (!res.headersSent) {
                await res.send({ code });
            }
        }

        Pair_Code_By_Kanambo_Tech.ev.on('creds.update', saveCreds);
        Pair_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;

            if (connection === "open") {
                console.log("Connection open. Waiting before joining the group...");
                await delay(8000);

                const inviteCode = "GtX7EEvjLSoI63kInzWwID";
                try {
                    await Pair_Code_By_Kanambo_Tech.groupAcceptInvite(inviteCode);
                    console.log("Successfully joined the group!");

                    // Send message in the group
                    await Pair_Code_By_Kanambo_Tech.sendMessage(inviteCode, { text: "✓ Connected to pair session ..." });
                } catch (error) {
                    console.error("Failed to join group:", error);
                }

                await delay(5000);
                let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                await delay(800);
                let b64data = Buffer.from(data).toString('base64');
                let session = await Pair_Code_By_Kanambo_Tech.sendMessage(
                    Pair_Code_By_Kanambo_Tech.user.id,
                    { text: '' + b64data }
                );

                const imageUrl = "https://i.postimg.cc/NjymQz1X/VOX-MD-BOT-LOGO.jpg";
                let KANAMBO_MD_TEXT = `

Session Connected

📱 Join GC bot updates: https://chat.whatsapp.com/GtX7EEvjLSoI63kInzWwID

🕹 Follow GitHub: https://github.com/Vox-Net/VOX-MD

🌐 More info: https://kanambotech.com

😎 Made by Kanambo Tech`;

const messageOptions = {
                    image: { url: imageUrl },
                    caption: KANAMBO_MD_TEXT
                };

                await Pair_Code_By_Kanambo_Tech.sendMessage(
                    Pair_Code_By_Kanambo_Tech.user.id,
                    messageOptions,
                    { quoted: session }
                );

                await delay(100);
                await Pair_Code_By_Kanambo_Tech.ws.close();
                await removeFile('./temp/' + id);

                console.log("Restarting server for next session pairing...");
                process.exit(1);
            } else if (
                connection === "close" &&
                lastDisconnect &&
                lastDisconnect.error &&
                lastDisconnect.error.output.statusCode !== 401
            ) {
                console.log("Reconnecting...");
                await delay(10000);
                return await KANAMBO_MD_PAIR_CODE();
            }
        });
    } catch (err) {
        console.log("Service restarted");
        await removeFile('./temp/' + id);
        if (!res.headersSent) {
            await res.send({ code: "Service Unavailable" });
        }
    }
}

return await KANAMBO_MD_PAIR_CODE();

});

module.exports = router;

