import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">IT Service Desk</CardTitle>
          <CardDescription>Sign in to submit and manage tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await signIn("microsoft-entra-id", { redirectTo: "/" })
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Microsoft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
