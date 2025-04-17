const express = require("express")
const redis = require("redis")

const app = express()
const PORT = 3000

// Create Redis client
const client = redis.createClient()

client.on("error", (err) => console.error("Redis Error:", err))

// Connect the Redis client
async function startServer() {
  await client.connect()

  // Simulated DB
  const fakeDB = {
    1: { id: 1, title: "First Post", content: "Welcome to the blog!" },
    2: { id: 2, title: "Second Post", content: "This is another post." },
  }

  // GET /post/:id
  app.get("/post/:id", async (req, res) => {
    const postId = req.params.id

    try {
      const data = await client.get(`post:${postId}`)

      if (data) {
        console.log("Cache hit ✅")
        res.send(JSON.parse(data))
      } else {
        console.log("Cache miss ❌")
        const post = fakeDB[postId]

        if (!post) {
          return res.status(404).send({ message: "Post not found" })
        }

        // Save to Redis with 60 sec expiration
        await client.setEx(`post:${postId}`, 60, JSON.stringify(post))
        res.send(post)
      }
    } catch (err) {
      console.error("Redis GET error:", err)
      res.status(500).send({ message: "Internal Server Error" })
    }
  })

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

startServer().catch(console.error)
