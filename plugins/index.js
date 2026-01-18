const fs = require("fs")
const path = require("path")

const plugins = []

const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".js") && f !== "index.js")

for (const file of files) {
  const plugin = require(path.join(__dirname, file))
  plugins.push(plugin)
}

module.exports = plugins
