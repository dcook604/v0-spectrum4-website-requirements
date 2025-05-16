import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { WysiwygEditor } from "@/components/editor/wysiwyg-editor"

interface EditPageParams {
  params: {
    id: string
  }
}

export default async function EditPagePage({ params }: EditPageParams) {
  const { id } = params
  const supabase = createServerClient()

  // Fetch the page data
  const { data: page, error } = await supabase.from("pages").select("*").eq("id", id).single()

  if (error || !page) {
    notFound()
  }

  return (
    <div>
      <WysiwygEditor
        pageId={id}
        initialData={{
          title: page.title,
          slug: page.slug,
          content: page.content,
          is_published: page.is_published,
        }}
      />
    </div>
  )
}
