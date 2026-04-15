"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createTicketSchema, type CreateTicketInput } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

type Department = { id: string; name: string; slug: string }

export function TicketForm() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      departmentId: "",
    },
  })

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments)
      .catch(() => toast.error("Failed to load departments"))
  }, [])

  async function onSubmit(data: CreateTicketInput) {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.fieldErrors ? "Validation failed" : "Failed to create ticket")
      }

      const ticket = await res.json()

      // Upload attachments
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        await fetch(`/api/tickets/${ticket.id}/attachments`, {
          method: "POST",
          body: formData,
        })
      }

      toast.success(`Ticket #${ticket.number} created`)
      router.push(`/tickets/${ticket.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit a New Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              onValueChange={(v) => v && form.setValue("departmentId", v)}
              defaultValue=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.departmentId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.departmentId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about your request..."
              rows={5}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              onValueChange={(v) =>
                v && form.setValue("priority", v as CreateTicketInput["priority"])
              }
              defaultValue="MEDIUM"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                onChange={(e) =>
                  setFiles(e.target.files ? Array.from(e.target.files) : [])
                }
                className="cursor-pointer"
              />
            </div>
            {files.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) selected
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
