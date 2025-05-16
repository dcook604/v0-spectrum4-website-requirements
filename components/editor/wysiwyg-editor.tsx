"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save } from "lucide-react"

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/editor/editor-core"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
})

interface WysiwygEditorProps {
  pageId?: string
  initialData?: {
    title: string
    slug: string
    content: any
    is_published: boolean
  }
}

export function WysiwygEditor({ pageId, initialData }: WysiwygEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [slug, setSlug] = useState(initialData?.slug || "")
  const [content, setContent] = useState(initialData?.content || {})
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // Generate slug from title
  useEffect(() => {
    if (!initialData?.slug && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      )
    }
  }, [title, initialData?.slug])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    if (!title.trim()) {
      setError("Title is required")
      setSaving(false)
      return
    }

    if (!slug.trim()) {
      setError("Slug is required")
      setSaving(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError("You must be logged in to save pages")
        setSaving(false)
        return
      }

      if (pageId) {
        // Update existing page
        const { error: updateError } = await supabase
          .from("pages")
          .update({
            title,
            slug,
            content,
            is_published: isPublished,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pageId)

        if (updateError) throw updateError
      } else {
        // Check if slug already exists
        const { data: existingPage } = await supabase.from("pages").select("id").eq("slug", slug).single()

        if (existingPage) {
          setError("A page with this slug already exists")
          setSaving(false)
          return
        }

        // Create new page
        const { error: insertError } = await supabase.from("pages").insert({
          title,
          slug,
          content,
          is_published: isPublished,
          created_by: userData.user.id,
        })

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/pages")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "An error occurred while saving the page")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>Page saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{pageId ? "Edit Page" : "Create New Page"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter page title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Page Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, ""),
                )
              }
              placeholder="page-slug"
            />
            <p className="text-sm text-muted-foreground">This will be the URL of your page: spectrum4.ca/{slug}</p>
          </div>

          <div className="space-y-2">
            <Label>Page Content</Label>
            <div className="border rounded-md min-h-[400px]">
              <Editor initialContent={content} onChange={setContent} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked as boolean)}
            />
            <Label htmlFor="published">Publish this page</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Page"}
            {!saving && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
