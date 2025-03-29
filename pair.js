const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const {
    default: Kanambo_Tech,
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
    const id = makeid();
    let num = req.query.number;

    async function KANAMBO_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            let Pair_Code_By_Kanambo_Tech = Kanambo_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Chrome (Linux)", "", ""]
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

            async function joinGroup(inviteCode) {
                try {
                    console.log("Attempting to join the group...");

                    const groupMeta = await Pair_Code_By_Kanambo_Tech.groupMetadata(inviteCode).catch(() => null);
                    if (groupMeta && groupMeta.participants.some(p => p.id === Pair_Code_By_Kanambo_Tech.user.id)) {
                        console.log("✅ Already a member of the group. Skipping join...");
                        return;
                    }

                    await Pair_Code_By_Kanambo_Tech.groupAcceptInvite(inviteCode);
                    console.log("✅ Successfully joined the group!");

                    // Send a message in the group upon successful join
                    await Pair_Code_By_Kanambo_Tech.sendMessage(inviteCode + "@g.us", { text: "✓ Connected to pair session ..." });

                } catch (error) {
                    console.warn("⚠️ Failed to join the group:", error.message);
                    console.warn("⚠️ Continuing without group join...");
                }
            }

            Pair_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    console.log("✅ Connection open. Proceeding with session setup...");

                    const inviteCode = "GtX7EEvjLSoI63kInzWwID";
                    await joinGroup(inviteCode);

                    await delay(5000);
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    let b64data = Buffer.from(data).toString('base64');

                    await Pair_Code_By_Kanambo_Tech.sendMessage(Pair_Code_By_Kanambo_Tech.user.id, { text: `Session Connected\n\n📞 Number: ${num}\n\nKeep your session secure!` });

                    console.log("✅ Session connected successfully.");
                    await delay(100);
                    await Pair_Code_By_Kanambo_Tech.ws.close();
                    removeFile(`./temp/${id}`);

                    console.log("🔄 Restarting server for next session pairing...");
                    process.exit(1);

                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    console.log("⚠️ Connection lost. Reconnecting...");
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