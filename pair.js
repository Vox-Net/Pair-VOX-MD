const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: Kanambo_Tech, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("maher-zubair-baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = Math.random().toString(36).substring(2, 10);  
    let num = req.query.number;

    if (!num) return res.status(400).json({ error: "Phone number is required" });

    num = num.startsWith('254') ? num : `254${num.slice(-9)}`; 

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

            if (!state || !state.creds || !state.creds.registered) {
                let code;
                try {
                    code = await Pair_Code_By_Kanambo_Tech.requestPairingCode(num);
                } catch (e) {
                    console.error("Failed to get pairing code:", e);
                    return res.status(500).json({ error: "Could not retrieve pairing code. Try again." });
                }

                res.json({ code });
            }

            Pair_Code_By_Kanambo_Tech.ev.on('creds.update', saveCreds);
            Pair_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    console.log("Connected successfully!");
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
            if (!res.headersSent) return res.status(500).json({ error: "Pairing service is temporarily unavailable. Try again later." });
        }
    }

    return await KANAMBO_MD_PAIR_CODE();
});

module.exports = router;