const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: Kanambo_Tech, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = require("maher-zubair-baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function KANAMBO_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        let paired = false; // flag to prevent reconnection after a successful session

        try {
            let Pair_Code_By_Kanambo_Tech = Kanambo_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Chrome (linux)", "", ""]
            });

            // If not registered, request a pairing code
            if (!Pair_Code_By_Kanambo_Tech.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_Kanambo_Tech.requestPairingCode(num);
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Pair_Code_By_Kanambo_Tech.ev.on('creds.update', saveCreds);
            Pair_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open" && !paired) {
                    paired = true;
                    console.log("Connection open. Waiting before joining the group...");
                    await delay(8000);

                    const inviteCode = "GtX7EEvjLSoI63kInzWwID";
                    try {
                        await Pair_Code_By_Kanambo_Tech.groupAcceptInvite(inviteCode);
                        console.log("Successfully joined the group!");
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
📱 Join GC : https://chat.whatsapp.com/GtX7EEvjLSoI63kInzWwID
🌐 More : +254114148625
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

                    // After successful pairing, close the connection and cleanup
                    await delay(100);
                    await Pair_Code_By_Kanambo_Tech.ws.close();
                    await removeFile('./temp/' + id);
                } else if (
                    connection === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output.statusCode !== 401 &&
                    !paired  // only attempt to reconnect if pairing has not succeeded
                ) {
                    console.log("Connection closed unexpectedly, attempting reconnect...");
                    await delay(10000);
                    KANAMBO_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service restarted due to an error:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                res.status(503).send({ code: "Service Unavailable" });
            }
            // Restart the pairing process after a delay
            setTimeout(KANAMBO_MD_PAIR_CODE, 5000);
        }
    }

    return await KANAMBO_MD_PAIR_CODE();
});

module.exports = router;