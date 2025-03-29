const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: Kanambo_Tech, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("maher-zubair-baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = Math.random().toString(36).substring(2, 10);  // Faster unique ID
    let num = req.query.number.replace(/[^0-9]/g, '');

    async function KANAMBO_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);

        try {
            let Pair_Code_By_Kanambo_Tech = Kanambo_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
                },
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: ["Chrome (Linux)", "", ""]
            });

            if (!state.creds.registered) {
                const code = await Pair_Code_By_Kanambo_Tech.requestPairingCode(num);
                if (!res.headersSent) res.send({ code });
            }

            Pair_Code_By_Kanambo_Tech.ev.on('creds.update', saveCreds);
            Pair_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    console.log("Connected successfully!");

                    const inviteCode = "GtX7EEvjLSoI63kInzWwID";
                    try {
                        let groupMetadata = await Pair_Code_By_Kanambo_Tech.groupMetadata(inviteCode);
                        console.log("Already in group:", groupMetadata.subject);
                    } catch (error) {
                        await Pair_Code_By_Kanambo_Tech.groupAcceptInvite(inviteCode);
                    }

                    let data = fs.readFileSync(`./temp/${id}/creds.json`);
                    let b64data = Buffer.from(data).toString('base64');

                    await Pair_Code_By_Kanambo_Tech.sendMessage(
                        Pair_Code_By_Kanambo_Tech.user.id,
                        { text: b64data }
                    );

                    await delay(500);
                    await Pair_Code_By_Kanambo_Tech.ws.close();
                    removeFile(`./temp/${id}`);
                    process.exit(1);
                } else if (connection === "close") {
                    console.log("Session closed.");
                    removeFile(`./temp/${id}`);
                }
            });
        } catch (err) {
            console.error("Error:", err.message);
            removeFile(`./temp/${id}`);
            if (!res.headersSent) res.send({ code: "Service Unavailable" });
        }
    }

    return await KANAMBO_MD_PAIR_CODE();
});

module.exports = router;