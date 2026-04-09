

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import { Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable, schema } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
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
import data from "@/app/dashboard/data.json"

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL ?? "/api")
type Customer = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: string
}

type CustomersApiResponse = {
  customers: Customer[]
}

type ApiCustomerPayload = {
  customer?: Customer[] | Customer
  customers?: Customer[]
}

type Quotation = {
  id: number
  electrician_id: number | null
  customer_id: number | null
  store_id: number | null
  notes: string | null
  created_at: string
  customers?: {
    name?: string | null
  } | null
  stores?: {
    name?: string | null
  } | null
  electricians?: {
    name?: string | null
  } | null
}

type QuotationsApiResponse = {
  quotations: Quotation[]
}

type QuotationItem = {
  id: number
  quantity: number | null
  materials?: {
    id?: number
    name?: string | null
    description?: string | null
    image_url?: string | null
  } | null
}

type QuotationDetail = Quotation & {
  quotation_items?: QuotationItem[]
}

type QuotationDetailApiResponse = {
  quotation?: QuotationDetail
}

const CUSTOMERS_API_URL = `${API_BASE_URL}/customers`

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [openCreatePopup, setOpenCreatePopup] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [openEditPopup, setOpenEditPopup] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState("")
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")

  const loadCustomers = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(CUSTOMERS_API_URL, {
        signal,
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const result = (await response.json()) as CustomersApiResponse
      setCustomers(normalizeCustomersFromPayload(result))
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError("Unable to reach backend API. Make sure Vite dev server is running and backend is reachable.")
        toast.error("Unable to reach backend API")
      } else {
        setError("Unable to fetch customers. Please check API server and CORS settings.")
        toast.error("Failed to fetch customers")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    loadCustomers(controller.signal)

    return () => controller.abort()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) {
      return customers
    }
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(term)
    )
  }, [customers, searchInput])

  async function handleCreateCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newName.trim()) {
      setCreateError("Name is required")
      return
    }

    try {
      setCreating(true)
      setCreateError("")

      const sendData = JSON.stringify({
        name: newName.trim(),
        phone: newPhone.trim() || null,
        address: newAddress.trim() || null,
      })

      const response = await fetch(CUSTOMERS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: sendData,
      })

      console.log("Create customer response:", response)

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `Request failed with status ${response.status}`)
      }

      let createdCustomers: Customer[] = []
      try {
        const createdPayload = (await response.json()) as ApiCustomerPayload
        createdCustomers = normalizeCustomersFromPayload(createdPayload)
      } catch {
        createdCustomers = []
      }

      if (createdCustomers.length > 0) {
        setCustomers((prev) => {
          const existingIds = new Set(prev.map((item) => item.id))
          const newOnes = createdCustomers.filter((item) => !existingIds.has(item.id))
          return [...newOnes, ...prev]
        })
      } else {
        setCustomers((prev) => [
          {
            id: Date.now(),
            name: newName.trim(),
            phone: newPhone.trim() || null,
            address: newAddress.trim() || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      setOpenCreatePopup(false)
      setNewName("")
      setNewPhone("")
      setNewAddress("")
      toast.success("Customer created successfully")
      void loadCustomers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create customer. Please try again."
      setCreateError(message)
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  function openEditCustomerPopup(customer: Customer) {
    setEditCustomerId(customer.id)
    setEditName(customer.name)
    setEditPhone(customer.phone ?? "")
    setEditAddress(customer.address ?? "")
    setEditError("")
    setOpenEditPopup(true)
  }

  async function handleEditCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editCustomerId) {
      setEditError("Customer id is missing")
      return
    }

    if (!editName.trim()) {
      setEditError("Name is required")
      return
    }

    const currentCustomer = customers.find((customer) => customer.id === editCustomerId)
    const nextName = editName.trim()
    const nextPhone = editPhone.trim() || null
    const nextAddress = editAddress.trim() || null

    if (
      currentCustomer &&
      currentCustomer.name === nextName &&
      (currentCustomer.phone ?? null) === nextPhone &&
      (currentCustomer.address ?? null) === nextAddress
    ) {
      setEditError("No changes detected")
      toast.info("No changes to update")
      return
    }

    try {
      setEditing(true)
      setEditError("")

      const response = await fetch(`${CUSTOMERS_API_URL}/${editCustomerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nextName,
          phone: nextPhone,
          address: nextAddress,
        }),
      })

      console.log("Edit customer response:", response)

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `Request failed with status ${response.status}`)
      }

      setCustomers((prev) =>
        prev.map((item) =>
          item.id === editCustomerId
            ? {
                ...item,
                name: nextName,
                phone: nextPhone,
                address: nextAddress,
              }
            : item
        )
      )

      setOpenEditPopup(false)
      toast.success("Customer updated successfully")
      void loadCustomers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update customer. Please try again."
      setEditError(message)
      toast.error(message)
    } finally {
      setEditing(false)
    }
  }

  function CustomersLoadingSkeleton() {
    const rows = Array.from({ length: 6 })

    return (
      <div className="space-y-4">
        <div className="w-full sm:max-w-sm">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="rounded-lg border p-3">
          <div className="grid grid-cols-[70px_1.5fr_1fr_1.5fr_1.5fr_120px] gap-2 pb-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="ml-auto h-6 w-16" />
          </div>
          <div className="space-y-2 border-t pt-2">
            {rows.map((_, index) => (
              <div
                key={`customer-skeleton-row-${index}`}
                className="grid grid-cols-[70px_1.5fr_1fr_1.5fr_1.5fr_120px] gap-2"
              >
                <Skeleton className="h-8 w-10" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="ml-auto h-8 w-16" />
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
          <CardTitle>Customers</CardTitle>
          <Sheet open={openCreatePopup} onOpenChange={setOpenCreatePopup}>
            <SheetTrigger asChild>
              <Button className="ml-auto">New Customer</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Create Customer</SheetTitle>
                <SheetDescription>
                  Add a new customer and save it to backend.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4 px-4" onSubmit={handleCreateCustomer}>
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Name</Label>
                  <Input
                    id="customer-name"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={newPhone}
                    onChange={(event) => setNewPhone(event.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-address">Address</Label>
                  <Input
                    id="customer-address"
                    value={newAddress}
                    onChange={(event) => setNewAddress(event.target.value)}
                    placeholder="Address"
                  />
                </div>

                {createError && <p className="text-sm text-destructive">{createError}</p>}

                <SheetFooter className="px-0">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Saving..." : "Save Customer"}
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
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by customer name"
            />
          </div>

          {loading && <CustomersLoadingSkeleton />}

          {!loading && error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.id}</TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone ?? "-"}</TableCell>
                        <TableCell>{customer.address ?? "-"}</TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCustomerPopup(customer)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <Sheet open={openEditPopup} onOpenChange={setOpenEditPopup}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Edit Customer</SheetTitle>
                <SheetDescription>
                  Update customer details and save to backend.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4 px-4" onSubmit={handleEditCustomer}>
                <div className="space-y-2">
                  <Label htmlFor="edit-customer-name">Name</Label>
                  <Input
                    id="edit-customer-name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-customer-phone">Phone</Label>
                  <Input
                    id="edit-customer-phone"
                    value={editPhone}
                    onChange={(event) => setEditPhone(event.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-customer-address">Address</Label>
                  <Input
                    id="edit-customer-address"
                    value={editAddress}
                    onChange={(event) => setEditAddress(event.target.value)}
                    placeholder="Address"
                  />
                </div>

                {editError && <p className="text-sm text-destructive">{editError}</p>}

                <SheetFooter className="px-0">
                  <Button type="submit" disabled={editing}>
                    {editing ? "Updating..." : "Update Customer"}
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


function normalizeCustomersFromPayload(payload: unknown): Customer[] {
  if (!payload || typeof payload !== "object") {
    return []
  }

  const data = payload as ApiCustomerPayload

  if (Array.isArray(data.customers)) {
    return data.customers
  }

  if (Array.isArray(data.customer)) {
    return data.customer
  }

  if (data.customer && typeof data.customer === "object") {
    return [data.customer]
  }

  return []
}