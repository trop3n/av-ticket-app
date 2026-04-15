import { signIn, entraIdConfigured } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">IT Service Desk</CardTitle>
          <CardDescription>Sign in to submit and manage tickets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === "CredentialsSignin" && (
            <p className="text-sm text-destructive text-center">
              Invalid email or password
            </p>
          )}

          <form
            action={async (formData: FormData) => {
              "use server"
              await signIn("credentials", {
                email: formData.get("email") as string,
                password: formData.get("password") as string,
                redirectTo: "/",
              })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          {entraIdConfigured && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form
                action={async () => {
                  "use server"
                  await signIn("microsoft-entra-id", { redirectTo: "/" })
                }}
              >
                <Button type="submit" variant="outline" className="w-full">
                  Sign in with Microsoft
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
