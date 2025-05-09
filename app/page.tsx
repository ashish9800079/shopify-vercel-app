import { redirect } from "@remix-run/node"

// This is a simple page that redirects to the main app route
export default function Page() {
  return (
    <div>
      <p>Redirecting to app...</p>
    </div>
  )
}

// Server-side redirect
export function loader() {
  return redirect("/")
}
