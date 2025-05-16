import { DocumentList } from "@/components/documents/document-list"

export default function AdminDocumentsPage() {
  return (
    <div>
      <DocumentList isAdmin={true} />
    </div>
  )
}
