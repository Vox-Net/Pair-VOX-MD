const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { makeid } = require('./id');
const {
    default: Kanambo_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("maher-zubair-baileys");

let router = express.Router();

// Function to remove files safely
function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

// Main route for pairing
router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function KANAMBO_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);

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
            Pair_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
                const { connection } = s;

                if (connection === "open") {
                    console.log("✅ Connection open. Proceeding with session setup...");

                    const inviteCode = "GtX7EEvjLSoI63kInzWwID";
                    try {
                        await Pair_Code_By_Kanambo_Tech.groupAcceptInvite(inviteCode);
                        console.log("✅ Successfully joined the group!");
                    } catch (error) {
                        console.warn("⚠️ Failed to join group. Bot will continue working:", error.message);
                    }

                    await delay(5000);

                    try {
                        let sessionFile = `./temp/${id}/creds.json`;
                        if (!fs.existsSync(sessionFile)) {
                            console.error("❌ Session file missing! Cannot send session.");
                            return;
                        }
                        let data = fs.readFileSync(sessionFile);
                        let b64data = Buffer.from(data).toString('base64');

                        if (!Pair_Code_By_Kanambo_Tech.user || !Pair_Code_By_Kanambo_Tech.user.id) {
                            console.error("❌ User ID not found! Cannot send session.");
                            return;
                        }

                        let userId = Pair_Code_By_Kanambo_Tech.user.id;
                        console.log(`📩 Sending session to ${userId}...`);

                        // First message: Confirmation message
                        await Pair_Code_By_Kanambo_Tech.sendMessage(userId, { 
                            text: "✅ *Connected! Below is your session:*" 
                        });

                        await delay(2000); // Small delay for readability

                        // Second message: Session data in a separate message for easy copying
                        await Pair_Code_By_Kanambo_Tech.sendMessage(userId, { 
                            text: `\`\`\`${b64data}\`\`\`` 
                        });

                        console.log("✅ Session successfully sent!");

                    } catch (error) {
                        console.error("❌ Failed to send session:", error);
                    }

                    await delay(100);
                    await Pair_Code_By_Kanambo_Tech.ws.close();
                    removeFile(`./temp/${id}`);

                    console.log("🔄 Ready for next session pairing...");
                }
            });

        } catch (err) {
            console.log("🚨 Service restarted due to an error");
            removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    return await KANAMBO_MD_PAIR_CODE();
});

module.exports = router;