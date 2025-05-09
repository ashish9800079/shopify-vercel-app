import { json, type LoaderFunctionArgs, createCookieSessionStorage, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { Page, Layout, Card, DataTable, Text, LegacyStack, Button, Badge } from "@shopify/polaris"

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

    // This would be where you fetch real data from Shopify API
    const testData = [
      ["Product 1", "Clothing", "$19.99", "In Stock"],
      ["Product 2", "Accessories", "$9.99", "Low Stock"],
      ["Product 3", "Home Goods", "$29.99", "Out of Stock"],
      ["Product 4", "Electronics", "$99.99", "In Stock"],
      ["Product 5", "Books", "$14.99", "In Stock"],
    ]

    return json({
      authenticated: true,
      shop: session.shop,
      testData,
    })
  } catch (error) {
    return json({
      authenticated: false,
      shop: null,
      testData: [],
    })
  }
}

export default function TestPage() {
  const { authenticated, shop, testData } = useLoaderData<typeof loader>()

  if (!authenticated) {
    return (
      <Page narrowWidth>
        <Card>
          <Card.Section>
            <Text variant="headingMd" as="h2">
              Authentication Required
            </Text>
            <Text variant="bodyMd" as="p">
              Please install the app to access this page.
            </Text>
            <Button url="/auth" primary>
              Go to Auth Page
            </Button>
          </Card.Section>
        </Card>
      </Page>
    )
  }

  return (
    <Page title="Test Page" subtitle="Sample data and UI components" breadcrumbs={[{ content: "Dashboard", url: "/" }]}>
      <Layout>
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                Sample Products
              </Text>
              <Text variant="bodyMd" as="p">
                This is a test page showing sample data with Polaris UI components.
              </Text>
            </Card.Section>
            <Card.Section>
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text"]}
                headings={["Product", "Category", "Price", "Status"]}
                rows={testData}
              />
            </Card.Section>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                Shop Information
              </Text>
              <LegacyStack vertical spacing="tight">
                <LegacyStack>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Shop:
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {shop}
                  </Text>
                </LegacyStack>
                <LegacyStack>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Status:
                  </Text>
                  <Badge status="success">Connected</Badge>
                </LegacyStack>
              </LegacyStack>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
