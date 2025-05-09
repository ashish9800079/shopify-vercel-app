import { redirect, createCookieSessionStorage } from "@remix-run/node"
import { Shopify } from "@shopify/shopify-api"

// Duplicate the functions here to satisfy the error
export async function requireAuth(request: Request) {
  const cookie = request.headers.get("Cookie")
  const sessionStorage = createCookieSessionStorage({
    cookie: {
      name: "shopify_session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET || "s3cr3t"],
      secure: process.env.NODE_ENV === "production",
    },
  })

  const session = await sessionStorage.getSession(cookie)
  const shopifySession = session.get("shopifySession")

  if (!shopifySession) {
    throw redirect("/auth")
  }

  return shopifySession
}

export async function createAuthUrl(shop: string) {
  const shopifyApi = new Shopify({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
    scopes: ["read_products", "write_products"],
    hostName: process.env.VERCEL_URL || process.env.HOST?.replace(/https?:\/\//, "") || "",
    isEmbeddedApp: true,
    apiVersion: "2023-10",
  })

  const authUrl = await shopifyApi.auth.beginAuth({
    shop,
    callbackPath: "/auth/callback",
    isOnline: false,
  })

  return authUrl
}

export async function handleAuthCallback(request: Request) {
  const shopifyApi = new Shopify({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
    scopes: ["read_products", "write_products"],
    hostName: process.env.VERCEL_URL || process.env.HOST?.replace(/https?:\/\//, "") || "",
    isEmbeddedApp: true,
    apiVersion: "2023-10",
  })

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      name: "shopify_session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET || "s3cr3t"],
      secure: process.env.NODE_ENV === "production",
    },
  })

  const url = new URL(request.url)
  const shop = url.searchParams.get("shop") || ""

  try {
    const session = await shopifyApi.auth.validateAuthCallback({
      rawRequest: request,
      rawResponse: new Response(),
    })

    // Store session
    const cookie = request.headers.get("Cookie")
    const cookieSession = await sessionStorage.getSession(cookie)
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
