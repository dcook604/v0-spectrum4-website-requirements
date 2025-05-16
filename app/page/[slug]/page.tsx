import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

interface PageParams {
  params: {
    slug: string
  }
}

export default async function DynamicPage({ params }: PageParams) {
  const { slug } = params
  const supabase = createServerClient()

  // Fetch the page content
  const { data: page, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !page) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  )
}
