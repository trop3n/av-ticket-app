import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-2xl font-bold">Not Found</h2>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  )
}
