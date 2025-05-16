export type User = {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
}

export type Page = {
  id: string
  title: string
  slug: string
  content: any
  is_published: boolean
  parent_id?: string
  order_index: number
  created_at: string
  updated_at: string
  created_by: string
}

export type Document = {
  id: string
  name: string
  description?: string
  file_path: string
  file_size: number
  file_type: string
  is_public: boolean
  category?: string
  created_at: string
  updated_at: string
  uploaded_by: string
}

export type NavigationItem = {
  id: string
  label: string
  url?: string
  page_id?: string
  parent_id?: string
  order_index: number
  is_dropdown: boolean
  children?: NavigationItem[]
}
