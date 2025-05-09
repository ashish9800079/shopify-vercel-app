import { createRequestHandler } from "@remix-run/express"
import express from "express"
import * as build from "@remix-run/dev/server-build"

const app = express()
const port = process.env.PORT || 3000

// Handle Remix requests
app.all(
  "*",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  }),
)

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})
