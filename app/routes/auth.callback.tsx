import { type LoaderFunctionArgs, redirect, createCookieSessionStorage } from "@remix-run/node"
import { Shopify } from "@shopify/shopify-api"

// Inline auth function to avoid import issues
async function handleAuthCallback(request: Request) {
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

export async function loader({ request }: LoaderFunctionArgs) {
  return handleAuthCallback(request)
}
