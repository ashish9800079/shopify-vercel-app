import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { Page, Layout, Card, EmptyState, Button, Text, LegacyStack } from "@shopify/polaris"
import { createCookieSessionStorage, redirect } from "@remix-run/node"

// Inline auth function to avoid import issues
async function requireAuth(request: Request) {
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

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await requireAuth(request)
    return json({
      authenticated: true,
      shop: session.shop,
    })
  } catch (error) {
    return json({
      authenticated: false,
      shop: null,
    })
  }
}

export default function Index() {
  const { authenticated, shop } = useLoaderData<typeof loader>()

  if (!authenticated) {
    return (
      <Page narrowWidth>
        <Card>
          <Card.Section>
            <EmptyState
              heading="Install the app"
              image="/placeholder.svg?height=200&width=200"
              action={{ content: "Install App", url: "/auth" }}
            >
              <p>You need to install the app to continue.</p>
            </EmptyState>
          </Card.Section>
        </Card>
      </Page>
    )
  }

  return (
    <Page
      title="Shopify App Dashboard"
      subtitle={`Connected to ${shop}`}
      primaryAction={{ content: "Go to Test Page", url: "/test" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                Welcome to your Shopify app
              </Text>
              <Text variant="bodyMd" as="p">
                This is a sample Shopify app built with Remix and Polaris UI components.
              </Text>
            </Card.Section>
            <Card.Section>
              <LegacyStack distribution="trailing">
                <Button url="/test" primary>
                  Go to Test Page
                </Button>
              </LegacyStack>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
