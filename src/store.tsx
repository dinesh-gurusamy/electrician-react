import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL ?? "/api")

const STORES_API_URL = `${API_BASE_URL}/stores`

type Store = {
  id: number
  name: string
  phone: string | null
  whatsapp_number: string | null
  address: string | null
  created_at: string
}

type StoresApiResponse = {
  stores: Store[]
}

type ApiStorePayload = {
  store?: Store[] | Store
  stores?: Store[]
}

function normalizeStoresFromPayload(payload: unknown): Store[] {
  if (!payload || typeof payload !== "object") {
    return []
  }

  const data = payload as ApiStorePayload

  if (Array.isArray(data.stores)) {
    return data.stores
  }

  if (Array.isArray(data.store)) {
    return data.store
  }

  if (data.store && typeof data.store === "object") {
    return [data.store]
  }

  return []
}

export function StorePage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")

  // Create state
  const [openCreatePopup, setOpenCreatePopup] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newWhatsapp, setNewWhatsapp] = useState("")
  const [newAddress, setNewAddress] = useState("")

  // Edit state
  const [openEditPopup, setOpenEditPopup] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState("")
  const [editStoreId, setEditStoreId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editWhatsapp, setEditWhatsapp] = useState("")
  const [editAddress, setEditAddress] = useState("")

  const loadStores = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(STORES_API_URL, { signal })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const result = (await response.json()) as StoresApiResponse
      setStores(normalizeStoresFromPayload(result))
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError("Unable to reach backend API. Make sure the backend is reachable.")
        toast.error("Unable to reach backend API")
      } else {
        setError("Unable to fetch stores. Please check API server and CORS settings.")
        toast.error("Failed to fetch stores")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadStores(controller.signal)
    return () => controller.abort()
  }, [loadStores])

  const filteredStores = useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return stores
    return stores.filter((store) =>
      store.name.toLowerCase().includes(term)
    )
  }, [stores, searchInput])

  async function handleCreateStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newName.trim()) {
      setCreateError("Name is required")
      return
    }

    try {
      setCreating(true)
      setCreateError("")

      const response = await fetch(STORES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || null,
          whatsapp_number: newWhatsapp.trim() || null,
          address: newAddress.trim() || null,
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `Request failed with status ${response.status}`)
      }

      let createdStores: Store[] = []
      try {
        const createdPayload = (await response.json()) as ApiStorePayload
        createdStores = normalizeStoresFromPayload(createdPayload)
      } catch {
        createdStores = []
      }

      if (createdStores.length > 0) {
        setStores((prev) => {
          const existingIds = new Set(prev.map((item) => item.id))
          const newOnes = createdStores.filter((item) => !existingIds.has(item.id))
          return [...newOnes, ...prev]
        })
      } else {
        setStores((prev) => [
          {
            id: Date.now(),
            name: newName.trim(),
            phone: newPhone.trim() || null,
            whatsapp_number: newWhatsapp.trim() || null,
            address: newAddress.trim() || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      setOpenCreatePopup(false)
      setNewName("")
      setNewPhone("")
      setNewWhatsapp("")
      setNewAddress("")
      toast.success("Store created successfully")
      void loadStores()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create store. Please try again."
      setCreateError(message)
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  function openEditStorePopup(store: Store) {
    setEditStoreId(store.id)
    setEditName(store.name)
    setEditPhone(store.phone ?? "")
    setEditWhatsapp(store.whatsapp_number ?? "")
    setEditAddress(store.address ?? "")
    setEditError("")
    setOpenEditPopup(true)
  }

  async function handleEditStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editStoreId) {
      setEditError("Store id is missing")
      return
    }

    if (!editName.trim()) {
      setEditError("Name is required")
      return
    }

    const currentStore = stores.find((store) => store.id === editStoreId)
    const nextName = editName.trim()
    const nextPhone = editPhone.trim() || null
    const nextWhatsapp = editWhatsapp.trim() || null
    const nextAddress = editAddress.trim() || null

    if (
      currentStore &&
      currentStore.name === nextName &&
      (currentStore.phone ?? null) === nextPhone &&
      (currentStore.whatsapp_number ?? null) === nextWhatsapp &&
      (currentStore.address ?? null) === nextAddress
    ) {
      setEditError("No changes detected")
      toast.info("No changes to update")
      return
    }

    try {
      setEditing(true)
      setEditError("")
      const response = await fetch(`${STORES_API_URL}/${editStoreId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          phone: nextPhone,
          whatsapp_number: nextWhatsapp,
          address: nextAddress,
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `Request failed with status ${response.status}`)
      }

      setStores((prev) =>
        prev.map((item) =>
          item.id === editStoreId
            ? {
                ...item,
                name: nextName,
                phone: nextPhone,
                whatsapp_number: nextWhatsapp,
                address: nextAddress,
              }
            : item
        )
      )

      setOpenEditPopup(false)
      toast.success("Store updated successfully")
      void loadStores()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update store. Please try again."
      setEditError(message)
      toast.error(message)
    } finally {
      setEditing(false)
    }
  }

  function StoresLoadingSkeleton() {
    const rows = Array.from({ length: 6 })
    return (
      <div className="space-y-4">
        <div className="w-full sm:max-w-sm">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="rounded-lg border p-3">
          <div className="grid grid-cols-[70px_1.5fr_1fr_1fr_1.5fr_1.5fr_120px] gap-2 pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          <div className="space-y-2 border-t pt-2">
            {rows.map((_, index) => (
              <div
                key={`store-skeleton-row-${index}`}
                className="grid grid-cols-[70px_1.5fr_1fr_1fr_1.5fr_1.5fr_120px] gap-2"
              >
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-start p-4 lg:p-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stores</CardTitle>

          {/* Create Store Sheet */}
          <Sheet open={openCreatePopup} onOpenChange={setOpenCreatePopup}>
            <SheetTrigger asChild>
              <Button className="ml-auto">New Store</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Create Store</SheetTitle>
                <SheetDescription>
                  Add a new store and save it to backend.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4 px-4" onSubmit={handleCreateStore}>
                <div className="space-y-2">
                  <Label htmlFor="store-name">Name</Label>
                  <Input
                    id="store-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Store name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone</Label>
                  <Input
                    id="store-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-whatsapp">WhatsApp Number</Label>
                  <Input
                    id="store-whatsapp"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    placeholder="WhatsApp number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address">Address</Label>
                  <Input
                    id="store-address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Address"
                  />
                </div>

                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}

                <SheetFooter className="px-0">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Saving..." : "Save Store"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="w-full sm:max-w-sm">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by store name"
            />
          </div>

          {loading && <StoresLoadingSkeleton />}

          {!loading && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell>{store.id}</TableCell>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.phone ?? "-"}</TableCell>
                        <TableCell>{store.whatsapp_number ?? "-"}</TableCell>
                        <TableCell>{store.address ?? "-"}</TableCell>
                        <TableCell>
                          {new Date(store.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditStorePopup(store)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No stores found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Edit Store Sheet */}
          <Sheet open={openEditPopup} onOpenChange={setOpenEditPopup}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Edit Store</SheetTitle>
                <SheetDescription>
                  Update store details and save to backend.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4 px-4" onSubmit={handleEditStore}>
                <div className="space-y-2">
                  <Label htmlFor="edit-store-name">Name</Label>
                  <Input
                    id="edit-store-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Store name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-store-phone">Phone</Label>
                  <Input
                    id="edit-store-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-store-whatsapp">WhatsApp Number</Label>
                  <Input
                    id="edit-store-whatsapp"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="WhatsApp number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-store-address">Address</Label>
                  <Input
                    id="edit-store-address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Address"
                  />
                </div>

                {editError && (
                  <p className="text-sm text-destructive">{editError}</p>
                )}

                <SheetFooter className="px-0">
                  <Button type="submit" disabled={editing}>
                    {editing ? "Updating..." : "Update Store"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  )
}
