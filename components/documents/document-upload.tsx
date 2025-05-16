"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload } from "lucide-react"

export function DocumentUpload() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    setError(null)
    setSuccess(false)

    if (!name.trim()) {
      setError("Document name is required")
      setUploading(false)
      return
    }

    if (!file) {
      setError("Please select a file to upload")
      setUploading(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError("You must be logged in to upload documents")
        setUploading(false)
        return
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `documents/${fileName}`

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

      // Insert document record
      const { error: insertError } = await supabase.from("documents").insert({
        name,
        description,
        category,
        file_path: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        is_public: isPublic,
        uploaded_by: userData.user.id,
      })

      if (insertError) throw insertError

      setSuccess(true)
      setName("")
      setDescription("")
      setCategory("")
      setFile(null)

      setTimeout(() => {
        router.push("/admin/documents")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "An error occurred during upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>Document uploaded successfully!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Document Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter document name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter document description"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category (Optional)</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting-minutes">Meeting Minutes</SelectItem>
              <SelectItem value="bylaws">Bylaws</SelectItem>
              <SelectItem value="financial">Financial Documents</SelectItem>
              <SelectItem value="forms">Forms</SelectItem>
              <SelectItem value="notices">Notices</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <Input id="file" type="file" onChange={handleFileChange} />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="isPublic" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked as boolean)} />
          <Label htmlFor="isPublic">Make this document publicly accessible</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Document"}
          {!uploading && <Upload className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
