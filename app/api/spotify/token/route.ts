import { NextResponse } from "next/server"

// Cache du token en mémoire (simple, pour la démo)
let cachedToken: { token: string; expiresAt: number } | null = null

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Spotify credentials not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." },
      { status: 500 },
    )
  }

  // Vérifier si on a un token valide en cache
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return NextResponse.json({ access_token: cachedToken.token })
  }

  try {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Spotify token error:", errorText)
      return NextResponse.json({ error: "Failed to get Spotify token" }, { status: response.status })
    }

    const data = await response.json()

    // Cache le token (expire 5 minutes avant la vraie expiration pour être safe)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    }

    return NextResponse.json({ access_token: data.access_token })
  } catch (error) {
    console.error("[v0] Spotify token fetch error:", error)
    return NextResponse.json({ error: "Failed to connect to Spotify" }, { status: 500 })
  }
}
