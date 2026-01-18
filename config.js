require('dotenv').config()

module.exports = {
  prefix: process.env.PREFIX || "!",
  owner: process.env.OWNER_NUMBER,
  botName: process.env.BOT_NAME || "wabot_chuck",
  maxWarn: parseInt(process.env.MAX_WARN) || 3
}
