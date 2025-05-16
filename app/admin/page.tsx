import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Menu, Upload, Users } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Pages</CardTitle>
          <CardDescription>Manage website pages</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Create, edit, and publish pages with the WYSIWYG editor.</p>
          <Button asChild>
            <Link href="/admin/pages">
              <FileText className="mr-2 h-4 w-4" />
              Manage Pages
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Manage document storage</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Upload and organize documents for users to download.</p>
          <Button asChild>
            <Link href="/admin/documents">
              <Upload className="mr-2 h-4 w-4" />
              Manage Documents
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>Manage website navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Create and organize navigation menus and dropdowns.</p>
          <Button asChild>
            <Link href="/admin/navigation">
              <Menu className="mr-2 h-4 w-4" />
              Manage Navigation
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage website users</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">View and manage user accounts and permissions.</p>
          <Button asChild>
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
