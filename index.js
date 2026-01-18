const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")
const qrcode = require("qrcode-terminal")
const messageHandler = require("./handlers/messageHandler")

async function startBot() {
    console.log("Starting bot...")

    const { state, saveCreds } = await useMultiFileAuthState("./session")

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "info" })
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log("QR Code received, scan it!")
            qrcode.generate(qr, { small: true })
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            console.log("Connection closed. Reconnect:", shouldReconnect)
            if (shouldReconnect) startBot()
        }

        if (connection === "open") {
            console.log("Bot connected to WhatsApp!")
        }
    })

    sock.ev.on("messages.upsert", async (msg) => {
        await messageHandler(sock, msg)
    })
}

startBot()
