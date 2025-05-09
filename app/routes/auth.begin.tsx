import { type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Shopify } from "@shopify/shopify-api"

// Inline auth function to avoid import issues
async function createAuthUrl(shop: string) {
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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shop = url.searchParams.get("shop")

  if (!shop) {
    return redirect("/auth")
  }

  // Validate shop domain
  if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
    return redirect(`/auth?error=invalid_shop&shop=${shop}`)
  }

  const authUrl = await createAuthUrl(shop)
  return redirect(authUrl)
}
