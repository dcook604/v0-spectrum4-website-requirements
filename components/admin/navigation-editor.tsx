"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { NavigationItem, Page } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Save, Trash2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

export function NavigationEditor() {
  const [navItems, setNavItems] = useState<NavigationItem[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch navigation items
      const { data: navData, error: navError } = await supabase.from("navigation").select("*").order("order_index")

      if (navError) {
        console.error("Error fetching navigation:", navError)
        return
      }

      // Fetch pages for selection
      const { data: pageData, error: pageError } = await supabase
        .from("pages")
        .select("id, title, slug")
        .eq("is_published", true)
        .order("title")

      if (pageError) {
        console.error("Error fetching pages:", pageError)
        return
      }

      // Transform flat navigation into hierarchical structure
      const rootItems: NavigationItem[] = []
      const itemMap = new Map<string, NavigationItem>()

      // First pass: create all items
      navData.forEach((item: any) => {
        itemMap.set(item.id, { ...item, children: [] })
      })

      // Second pass: build hierarchy
      navData.forEach((item: any) => {
        const navItem = itemMap.get(item.id)
        if (item.parent_id) {
          const parent = itemMap.get(item.parent_id)
          if (parent && navItem) {
            parent.children?.push(navItem)
          }
        } else if (navItem) {
          rootItems.push(navItem)
        }
      })

      setNavItems(rootItems)
      setPages(pageData)
    }

    fetchData()
  }, [supabase])

  const addRootItem = () => {
    setNavItems([
      ...navItems,
      {
        id: `temp-${Date.now()}`,
        label: "",
        url: "",
        order_index: navItems.length,
        is_dropdown: false,
        children: [],
      },
    ])
  }

  const addChildItem = (parentIndex: number) => {
    const updatedItems = [...navItems]
    if (!updatedItems[parentIndex].children) {
      updatedItems[parentIndex].children = []
    }

    updatedItems[parentIndex].children?.push({
      id: `temp-${Date.now()}-${parentIndex}`,
      label: "",
      url: "",
      parent_id: updatedItems[parentIndex].id,
      order_index: updatedItems[parentIndex].children?.length || 0,
      is_dropdown: false,
    })

    setNavItems(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = [...navItems]
    updatedItems.splice(index, 1)
    setNavItems(updatedItems)
  }

  const removeChildItem = (parentIndex: number, childIndex: number) => {
    const updatedItems = [...navItems]
    updatedItems[parentIndex].children?.splice(childIndex, 1)
    setNavItems(updatedItems)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...navItems]
    ;(updatedItems[index] as any)[field] = value
    setNavItems(updatedItems)
  }

  const updateChildItem = (parentIndex: number, childIndex: number, field: string, value: any) => {
    const updatedItems = [...navItems]
    if (updatedItems[parentIndex].children && updatedItems[parentIndex].children![childIndex]) {
      ;(updatedItems[parentIndex].children![childIndex] as any)[field] = value
    }
    setNavItems(updatedItems)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(navItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order_index values
    items.forEach((item, index) => {
      item.order_index = index
    })

    setNavItems(items)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate navigation items
      for (const item of navItems) {
        if (!item.label.trim()) {
          setError("All navigation items must have a label")
          setSaving(false)
          return
        }

        if (!item.url && !item.page_id && !item.is_dropdown) {
          setError("Navigation items must have either a URL, a page, or be a dropdown")
          setSaving(false)
          return
        }

        if (item.children && item.children.length > 0) {
          for (const child of item.children) {
            if (!child.label.trim()) {
              setError("All dropdown items must have a label")
              setSaving(false)
              return
            }

            if (!child.url && !child.page_id) {
              setError("Dropdown items must have either a URL or a page")
              setSaving(false)
              return
            }
          }
        }
      }

      // Delete all existing navigation items
      await supabase.from("navigation").delete().neq("id", "placeholder")

      // Prepare items for insertion
      const flatItems: any[] = []

      navItems.forEach((item, index) => {
        const { children, ...itemWithoutChildren } = item

        // Add root item
        const rootItem = {
          ...itemWithoutChildren,
          order_index: index,
          parent_id: null,
        }

        // If it's a new item, remove the temporary ID
        if (rootItem.id.startsWith("temp-")) {
          delete rootItem.id
        }

        flatItems.push(rootItem)

        // Add children if any
        if (children && children.length > 0) {
          children.forEach((child, childIndex) => {
            const childItem = {
              ...child,
              order_index: childIndex,
              parent_id: item.id,
            }

            // If it's a new item, remove the temporary ID
            if (childItem.id.startsWith("temp-")) {
              delete childItem.id
            }

            flatItems.push(childItem)
          })
        }
      })

      // Insert all items
      const { error: insertError } = await supabase.from("navigation").insert(flatItems)

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "An error occurred while saving the navigation")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Navigation Editor</CardTitle>
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
            <AlertDescription>Navigation saved successfully!</AlertDescription>
          </Alert>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="navigation-items">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {navItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="border rounded-md p-4 space-y-4"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`item-${index}-label`}>Label</Label>
                            <Input
                              id={`item-${index}-label`}
                              value={item.label}
                              onChange={(e) => updateItem(index, "label", e.target.value)}
                              placeholder="Navigation Label"
                            />
                          </div>

                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`item-${index}-url`}>URL (optional)</Label>
                            <Input
                              id={`item-${index}-url`}
                              value={item.url || ""}
                              onChange={(e) => updateItem(index, "url", e.target.value)}
                              placeholder="https://example.com"
                              disabled={!!item.page_id}
                            />
                          </div>

                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`item-${index}-page`}>Page (optional)</Label>
                            <Select
                              value={item.page_id || ""}
                              onValueChange={(value) => updateItem(index, "page_id", value || null)}
                              disabled={!!item.url}
                            >
                              <SelectTrigger id={`item-${index}-page`}>
                                <SelectValue placeholder="Select a page" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {pages.map((page) => (
                                  <SelectItem key={page.id} value={page.id}>
                                    {page.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <Button variant="destructive" size="icon" onClick={() => removeItem(index)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`item-${index}-dropdown`}
                            checked={item.is_dropdown}
                            onCheckedChange={(checked) => updateItem(index, "is_dropdown", checked as boolean)}
                          />
                          <Label htmlFor={`item-${index}-dropdown`}>This is a dropdown menu</Label>
                        </div>

                        {item.is_dropdown && (
                          <div className="pl-6 border-l space-y-4">
                            <div className="font-medium">Dropdown Items</div>

                            {item.children &&
                              item.children.map((child, childIndex) => (
                                <div key={child.id} className="border rounded-md p-4">
                                  <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 space-y-2">
                                      <Label htmlFor={`child-${index}-${childIndex}-label`}>Label</Label>
                                      <Input
                                        id={`child-${index}-${childIndex}-label`}
                                        value={child.label}
                                        onChange={(e) => updateChildItem(index, childIndex, "label", e.target.value)}
                                        placeholder="Dropdown Item Label"
                                      />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                      <Label htmlFor={`child-${index}-${childIndex}-url`}>URL (optional)</Label>
                                      <Input
                                        id={`child-${index}-${childIndex}-url`}
                                        value={child.url || ""}
                                        onChange={(e) => updateChildItem(index, childIndex, "url", e.target.value)}
                                        placeholder="https://example.com"
                                        disabled={!!child.page_id}
                                      />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                      <Label htmlFor={`child-${index}-${childIndex}-page`}>Page (optional)</Label>
                                      <Select
                                        value={child.page_id || ""}
                                        onValueChange={(value) =>
                                          updateChildItem(index, childIndex, "page_id", value || null)
                                        }
                                        disabled={!!child.url}
                                      >
                                        <SelectTrigger id={`child-${index}-${childIndex}-page`}>
                                          <SelectValue placeholder="Select a page" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">None</SelectItem>
                                          {pages.map((page) => (
                                            <SelectItem key={page.id} value={page.id}>
                                              {page.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex items-end">
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeChildItem(index, childIndex)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addChildItem(index)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add Dropdown Item
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button variant="outline" onClick={addRootItem} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Navigation Item
        </Button>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Navigation"}
          {!saving && <Save className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
