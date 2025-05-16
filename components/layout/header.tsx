"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { NavigationItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchNavigation = async () => {
      const { data, error } = await supabase.from("navigation").select("*").order("order_index")

      if (error) {
        console.error("Error fetching navigation:", error)
        return
      }

      // Transform flat navigation into hierarchical structure
      const navItems: NavigationItem[] = []
      const itemMap = new Map<string, NavigationItem>()

      // First pass: create all items
      data.forEach((item: any) => {
        itemMap.set(item.id, { ...item, children: [] })
      })

      // Second pass: build hierarchy
      data.forEach((item: any) => {
        const navItem = itemMap.get(item.id)
        if (item.parent_id) {
          const parent = itemMap.get(item.parent_id)
          if (parent && navItem) {
            parent.children?.push(navItem)
          }
        } else if (navItem) {
          navItems.push(navItem)
        }
      })

      setNavigation(navItems)
    }

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    fetchNavigation()
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderNavItem = (item: NavigationItem) => {
    const isActive = pathname === item.url || pathname === `/page/${item.page_id}`

    if (item.is_dropdown && item.children && item.children.length > 0) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              {item.label} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {item.children.map((child) => (
              <DropdownMenuItem key={child.id} asChild>
                <Link href={child.url || `/page/${child.page_id}`} className="w-full">
                  {child.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Link
        key={item.id}
        href={item.url || `/page/${item.page_id}`}
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
        }`}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <header className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image src="/images/logo.png" alt="Spectrum 4 Logo" width={150} height={40} className="h-10 w-auto" />
            </Link>
            <nav className="hidden md:ml-6 md:flex md:space-x-4 items-center">{navigation.map(renderNavItem)}</nav>
          </div>

          <div className="hidden md:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {user.user_metadata?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default">
                <Link href="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => (
              <div key={item.id}>
                {item.is_dropdown && item.children && item.children.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 font-medium">{item.label}</div>
                    <div className="pl-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.url || `/page/${child.page_id}`}
                          className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.url || `/page/${item.page_id}`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-muted">
            {user ? (
              <div className="px-2 space-y-1">
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                {user.user_metadata?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-2">
                <Link
                  href="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
