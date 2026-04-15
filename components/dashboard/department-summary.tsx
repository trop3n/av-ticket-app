"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type DeptSummary = {
  name: string
  slug: string
  total: number
  open: number
  done: number
}

const slugToRoute: Record<string, string> = {
  AV: "av",
  ENGINEERING: "engineering",
  TECH_SUPPORT: "tech-support",
}

export function DepartmentSummary({ departments }: { departments: DeptSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {departments.map((dept) => (
            <Link
              key={dept.slug}
              href={`/board/${slugToRoute[dept.slug] || dept.slug.toLowerCase()}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <h3 className="font-semibold">{dept.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{dept.total} total</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {dept.open} open
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {dept.done} done
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
