"use client"

import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { Page, Card, FormLayout, TextField, Button, Banner } from "@shopify/polaris"
import { useState } from "react"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shop = url.searchParams.get("shop") || ""
  const error = url.searchParams.get("error") || ""

  return json({ shop, error })
}

export default function Auth() {
  const { shop: initialShop, error } = useLoaderData<typeof loader>()
  const [shop, setShop] = useState(initialShop)

  return (
    <Page narrowWidth>
      <Card>
        <Card.Section>
          <FormLayout>
            <h1 className="text-2xl font-bold mb-4">Shopify App Installation</h1>

            {error && <Banner status="critical">Authentication failed. Please try again.</Banner>}

            <TextField
              label="Shop Domain"
              value={shop}
              onChange={setShop}
              placeholder="your-store.myshopify.com"
              helpText="Enter your shop domain to install the app"
              autoComplete="off"
            />

            <Button primary url={`/auth/begin?shop=${shop}`} disabled={!shop}>
              Install App
            </Button>
          </FormLayout>
        </Card.Section>
      </Card>
    </Page>
  )
}
