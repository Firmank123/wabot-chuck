const express = require("express")
const app = express()

app.get("/", (req, res) => {
  res.send("🤖 wabot-chuck is alive!")
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`KeepAlive server running on port ${PORT}`)
})
