import { Shopify } from "@shopify/shopify-api"
import { redirect } from "@remix-run/node"
import { createCookieSessionStorage } from "@remix-run/node"

// Initialize Shopify API
export const shopifyApi = new Shopify({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: ["read_products", "write_products"],
  hostName: process.env.VERCEL_URL || process.env.HOST?.replace(/https?:\/\//, "") || "",
  isEmbeddedApp: true,
  apiVersion: "2023-10",
})

// Session storage
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "shopify_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "s3cr3t"],
    secure: process.env.NODE_ENV === "production",
  },
})

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie")
  return sessionStorage.getSession(cookie)
}

// Export the functions directly
export async function requireAuth(request: Request) {
  const session = await getSession(request)
  const shopifySession = session.get("shopifySession")

  if (!shopifySession) {
    throw redirect("/auth")
  }

  return shopifySession
}

export async function createAuthUrl(shop: string) {
  const authUrl = await shopifyApi.auth.beginAuth({
    shop,
    callbackPath: "/auth/callback",
    isOnline: false,
  })

  return authUrl
}

export async function handleAuthCallback(request: Request) {
  const url = new URL(request.url)
  const shop = url.searchParams.get("shop") || ""

  try {
    const session = await shopifyApi.auth.validateAuthCallback({
      rawRequest: request,
      rawResponse: new Response(),
    })

    // Store session
    const cookieSession = await getSession(request)
    cookieSession.set("shopifySession", session)

    return redirect("/", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(cookieSession),
      },
    })
  } catch (error) {
    console.error("Auth error:", error)
    return redirect(`/auth?shop=${shop}&error=auth_failed`)
  }
}
