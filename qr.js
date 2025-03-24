const express = require('express');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require("pino");
const { default: Kanambo_Tech, useMultiFileAuthState, Browsers, delay } = require("@whiskeysockets/baileys");
const { makeid } = require('./id');

let router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

router.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>QR Code Login</title>
                <script>
                    function refreshQR() {
                        fetch('/get-qrcode')
                            .then(response => response.blob())
                            .then(blob => {
                                const url = URL.createObjectURL(blob);
                                document.getElementById('qrcode').src = url;
                            })
                            .catch(error => console.error('Error refreshing QR:', error));
                    }
                </script>
            </head>
            <body>
                <h1>Scan QR Code to Login</h1>
                <img id="qrcode" src="/get-qrcode" alt="QR Code" width="300" height="300"/>
                <br/>
                <button onclick="refreshQR()">Refresh QR Code</button>
            </body>
        </html>
    `);
});

router.get('/get-qrcode', async (req, res) => {
    const id = makeid();
    
    async function KANAMBO_MD_QR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            let Qr_Code_By_Kanambo_Tech = Kanambo_Tech({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: ["Firefox", "VOXMD", "1.0"]
            });

            Qr_Code_By_Kanambo_Tech.ev.on('creds.update', saveCreds);
            Qr_Code_By_Kanambo_Tech.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) {
                    res.setHeader('Content-Type', 'image/png');
                    res.end(await QRCode.toBuffer(qr));
                    console.log("QR Code Generated - Scan Now!");
                }

                if (connection === "open") {
                    console.log("Successfully logged in!");
                    await delay(2000);

                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await Qr_Code_By_Kanambo_Tech.sendMessage(Qr_Code_By_Kanambo_Tech.user.id, { text: b64data });

                    let KANAMBO_MD_TEXT = `
✅ Session Successfully Connected via KANAMBO!
━━━━━━━━━━━━━━━━━━━
🌐 GitHub Repo: View Project
📌 WhatsApp Group: Join Us
━━━━━━━━━━━━━━━━━━━
💡 Thank you for choosing VOXNET.INC!
✨ Keep your session private.
`;

                    await Qr_Code_By_Kanambo_Tech.sendMessage(Qr_Code_By_Kanambo_Tech.user.id, { text: KANAMBO_MD_TEXT }, { quoted: session });

                    await delay(1000);
                    await Qr_Code_By_Kanambo_Tech.ws.close();
                    return await removeFile("temp/" + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log("Reconnecting in 5 seconds...");
                    await delay(5000);
                    KANAMBO_MD_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Error:", err);
            if (!res.headersSent) {
                res.json({ code: "Service Unavailable" });
            }
            await removeFile("temp/" + id);
        }
    }

    return await KANAMBO_MD_QR_CODE();
});

// Fix favicon.ico error spam
router.get('/favicon.ico', (req, res) => res.status(204));

module.exports = router;