import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import { Navigate, Outlet, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, schema } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { XIcon } from "lucide-react"
import data from "@/app/dashboard/data.json"
import { CustomersPage } from "./customer"
import { StorePage} from "./store";
import { MaterialsPage } from "./materials";

const tableData = schema.array().parse(data)
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL ?? "/api")
const QUOTATIONS_API_URL = `${API_BASE_URL}/quotations`
const QUOTATION_DETAILS_API_URL = `${API_BASE_URL}/quotations`
const QUOTATION_ITEMS_API_URL = `${API_BASE_URL}/quotation-items`
const CUSTOMERS_API_URL = `${API_BASE_URL}/customers`
const STORES_API_URL = `${API_BASE_URL}/stores`
const MATERIALS_API_URL = `${API_BASE_URL}/materials`

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
    whatsapp_number?: string | null
  } | null
  electricians?: {
    name?: string | null
  } | null
}

type QuotationsApiResponse = {
  quotations: Quotation[]
}

type QuotationCreatePayload = {
  quotation?: Quotation[] | Quotation
}

type CustomerOption = {
  id: number
  name: string
}

type StoreOption = {
  id: number
  name: string
}

type MaterialOption = {
  id: number
  name: string
}

type CustomersApiResponse = {
  customers: CustomerOption[]
}

type StoresApiResponse = {
  stores: StoreOption[]
}

type MaterialsApiResponse = {
  materials: MaterialOption[]
}

type QuotationItemFormRow = {
  materialId: string
  quantity: string
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



function DashboardPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={tableData} />
    </div>
  )
}

function SmallPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-1 items-start p-4 lg:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ViewQuotationPage() {
  const { id } = useParams()
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) {
      setError("Quotation id is missing")
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadQuotationDetails() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`${QUOTATION_DETAILS_API_URL}/${id}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const result = (await response.json()) as QuotationDetailApiResponse
        if (!result.quotation) {
          throw new Error("Quotation details not found")
        }
        setQuotation(result.quotation)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return
        }
        setError("Unable to fetch quotation details")
        toast.error("Failed to fetch quotation details")
      } finally {
        setLoading(false)
      }
    }

    loadQuotationDetails()

    return () => controller.abort()
  }, [id])

  function QuotationDetailsSkeleton() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="rounded-lg border p-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  function getWhatsappNumber(rawValue: string | null | undefined) {
    if (!rawValue) {
      return ""
    }

    const digitsOnly = rawValue.replace(/\D/g, "")
    if (!digitsOnly) {
      return ""
    }

    if (digitsOnly.length === 10) {
      return `91${digitsOnly}`
    }

    return digitsOnly
  }

  function buildWhatsappMessage(currentQuotation: QuotationDetail) {
    const lines: string[] = []
    lines.push(`Quotation #${currentQuotation.id}`)
    lines.push(`Customer: ${currentQuotation.customers?.name ?? "-"}`)
    lines.push(`Store: ${currentQuotation.stores?.name ?? "-"}`)
    lines.push(`Date: ${new Date(currentQuotation.created_at).toLocaleString()}`)
    lines.push("")
    lines.push("Items:")

    if (currentQuotation.quotation_items && currentQuotation.quotation_items.length > 0) {
      currentQuotation.quotation_items.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.materials?.name ?? "Material"} - Qty: ${item.quantity ?? 0}`)
      })
    } else {
      lines.push("No items")
    }

    if (currentQuotation.notes?.trim()) {
      lines.push("")
      lines.push(`Notes: ${currentQuotation.notes.trim()}`)
    }

    return lines.join("\n")
  }

  function handleSendToStoreWhatsapp() {
    if (!quotation) {
      return
    }

    const whatsappNumber = getWhatsappNumber(quotation.stores?.whatsapp_number)
    if (!whatsappNumber) {
      toast.error("Store WhatsApp number is missing")
      return
    }

    const message = buildWhatsappMessage(quotation)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex flex-1 items-start p-4 lg:p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{`Quotation #${id ?? "-"}`}</CardTitle>
            {!loading && !error && quotation && (
              <Button type="button" onClick={handleSendToStoreWhatsapp}>
                Send to store WhatsApp
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <QuotationDetailsSkeleton />}

          {!loading && error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && quotation && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{quotation.customers?.name ?? "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Store</p>
                  <p className="text-sm font-medium">{quotation.stores?.name ?? "-"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    WhatsApp: {quotation.stores?.whatsapp_number ?? "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm font-medium">{new Date(quotation.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{quotation.notes ?? "-"}</p>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.quotation_items && quotation.quotation_items.length > 0 ? (
                      quotation.quotation_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.materials?.name ?? "-"}</TableCell>
                          <TableCell>{item.materials?.description ?? "-"}</TableCell>
                          <TableCell>{item.quantity ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No quotation items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuotationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [openCreateSheet, setOpenCreateSheet] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createCustomerId, setCreateCustomerId] = useState("")
  const [createStoreId, setCreateStoreId] = useState("")
  const [createNotes, setCreateNotes] = useState("")
  const [createItems, setCreateItems] = useState<QuotationItemFormRow[]>([
    { materialId: "", quantity: "1" },
  ])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    const customerId = searchParams.get("customerId")
    return customerId && /^\d+$/.test(customerId) ? customerId : "all"
  })

  const loadReferenceData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [customersResponse, storesResponse, materialsResponse] =
        await Promise.all([
          fetch(CUSTOMERS_API_URL, { signal }),
          fetch(STORES_API_URL, { signal }),
          fetch(MATERIALS_API_URL, { signal }),
        ])

      if (!customersResponse.ok) {
        throw new Error(`Customers request failed with status ${customersResponse.status}`)
      }
      if (!storesResponse.ok) {
        throw new Error(`Stores request failed with status ${storesResponse.status}`)
      }
      if (!materialsResponse.ok) {
        throw new Error(`Materials request failed with status ${materialsResponse.status}`)
      }

      const customersResult = (await customersResponse.json()) as CustomersApiResponse
      const storesResult = (await storesResponse.json()) as StoresApiResponse
      const materialsResult = (await materialsResponse.json()) as MaterialsApiResponse

      setCustomers(Array.isArray(customersResult.customers) ? customersResult.customers : [])
      setStores(Array.isArray(storesResult.stores) ? storesResult.stores : [])
      setMaterials(Array.isArray(materialsResult.materials) ? materialsResult.materials : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }
      toast.error("Failed to load quotation form data")
    }
  }, [])

  const loadQuotations = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(QUOTATIONS_API_URL, { signal })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const result = (await response.json()) as QuotationsApiResponse
      setQuotations(Array.isArray(result.quotations) ? result.quotations : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }
      setError("Unable to fetch quotations")
      toast.error("Failed to fetch quotations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadQuotations(controller.signal)
    loadReferenceData(controller.signal)
    return () => controller.abort()
  }, [loadQuotations, loadReferenceData])

  function resetCreateQuotationForm() {
    setCreateCustomerId("")
    setCreateStoreId("")
    setCreateNotes("")
    setCreateItems([{ materialId: "", quantity: "1" }])
    setCreateError("")
  }

  function addCreateItemRow() {
    setCreateItems((prev) => [...prev, { materialId: "", quantity: "1" }])
  }

  function removeCreateItemRow(indexToRemove: number) {
    setCreateItems((prev) => {
      if (prev.length <= 1) {
        return prev
      }
      return prev.filter((_, index) => index !== indexToRemove)
    })
  }

  function updateCreateItemRow(indexToUpdate: number, key: keyof QuotationItemFormRow, value: string) {
    setCreateItems((prev) =>
      prev.map((item, index) =>
        index === indexToUpdate
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    )
  }

  async function handleCreateQuotation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!createCustomerId || !createStoreId) {
      setCreateError("Customer and store are required")
      return
    }

    const normalizedItems = createItems
      .map((item) => ({
        materialId: Number(item.materialId),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Number.isInteger(item.materialId) && Number.isInteger(item.quantity) && item.quantity > 0)

    if (normalizedItems.length === 0) {
      setCreateError("At least one valid material item is required")
      return
    }

    if (normalizedItems.length !== createItems.length) {
      setCreateError("Each item must include material and quantity greater than 0")
      return
    }

    try {
      setCreating(true)
      setCreateError("")

      const quotationResponse = await fetch(QUOTATIONS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          electrician_id: null,
          customer_id: Number(createCustomerId),
          store_id: Number(createStoreId),
          notes: createNotes.trim() || null,
        }),
      })

      if (!quotationResponse.ok) {
        const responseText = await quotationResponse.text()
        throw new Error(responseText || `Request failed with status ${quotationResponse.status}`)
      }

      const quotationResult = (await quotationResponse.json()) as QuotationCreatePayload
      const createdQuotation = Array.isArray(quotationResult.quotation)
        ? quotationResult.quotation[0]
        : quotationResult.quotation

      if (!createdQuotation?.id) {
        throw new Error("Quotation created but ID was not returned")
      }

      await Promise.all(
        normalizedItems.map(async (item) => {
          const itemResponse = await fetch(QUOTATION_ITEMS_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quotation_id: createdQuotation.id,
              material_id: item.materialId,
              quantity: item.quantity,
            }),
          })

          if (!itemResponse.ok) {
            const responseText = await itemResponse.text()
            throw new Error(responseText || `Quotation item request failed with status ${itemResponse.status}`)
          }
        })
      )

      setOpenCreateSheet(false)
      resetCreateQuotationForm()
      toast.success("Quotation created successfully")
      void loadQuotations()
      navigate(`/quotations/${createdQuotation.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create quotation"
      setCreateError(message)
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const filteredQuotations = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return quotations.filter((quotation) => {
      if (selectedCustomerId !== "all" && quotation.customer_id !== Number(selectedCustomerId)) {
        return false
      }

      const createdAt = new Date(quotation.created_at)
      if (from && createdAt < from) {
        return false
      }
      if (to && createdAt > to) {
        return false
      }
      return true
    })
  }, [quotations, fromDate, toDate, selectedCustomerId])

  const customerFilterOptions = useMemo(() => {
    const map = new Map<number, string>()

    quotations.forEach((quotation) => {
      if (!quotation.customer_id) {
        return
      }

      if (!map.has(quotation.customer_id)) {
        map.set(
          quotation.customer_id,
          quotation.customers?.name?.trim() || `Customer #${quotation.customer_id}`
        )
      }
    })

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [quotations])

  function handleCustomerFilterChange(value: string) {
    setSelectedCustomerId(value)

    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete("customerId")
    } else {
      params.set("customerId", value)
    }
    setSearchParams(params)
  }

  function QuotationsLoadingSkeleton() {
    const rows = Array.from({ length: 6 })

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-8 w-full sm:w-44" />
          <Skeleton className="h-8 w-full sm:w-44" />
          <Skeleton className="h-8 w-full sm:w-24" />
        </div>
        <div className="rounded-lg border p-3">
          <div className="grid grid-cols-6 gap-2 pb-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2 border-t pt-2">
            {rows.map((_, index) => (
              <div key={`quotation-skeleton-row-${index}`} className="grid grid-cols-6 gap-2">
                <Skeleton className="h-8 w-10" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
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
        <CardHeader>
          <CardTitle>All quotations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedCustomerId} onValueChange={handleCustomerFilterChange}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All quotations</SelectItem>
                {customerFilterOptions.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="sm:w-44"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="sm:w-44"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFromDate("")
                setToDate("")
                handleCustomerFilterChange("all")
              }}
            >
              Clear filter
            </Button>
            <Sheet
              open={openCreateSheet}
              onOpenChange={(open) => {
                setOpenCreateSheet(open)
                if (!open) {
                  resetCreateQuotationForm()
                }
              }}
            >
              <SheetTrigger asChild>
                <Button type="button">Create quotation</Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl overflow-y-auto px-5">
                <SheetHeader>
                  <SheetTitle>Create quotation</SheetTitle>
                  <SheetDescription>
                    Add quotation details and one or more material items.
                  </SheetDescription>
                </SheetHeader>

                <form className="mt-4 space-y-6 pb-4" onSubmit={handleCreateQuotation}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="quotation-customer">Customer</Label>
                      <Select value={createCustomerId} onValueChange={setCreateCustomerId}>
                        <SelectTrigger id="quotation-customer" className="w-full">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="quotation-store">Store</Label>
                      <Select value={createStoreId} onValueChange={setCreateStoreId}>
                        <SelectTrigger id="quotation-store" className="w-full">
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="quotation-notes">Notes</Label>
                      <Input
                        id="quotation-notes"
                        value={createNotes}
                        onChange={(event) => setCreateNotes(event.target.value)}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Quotation items</h4>
                    </div>

                    <div className="space-y-3">
                      {createItems.map((item, index) => (
                        <div key={`quotation-item-row-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_120px_44px] sm:items-end">
                          <Select
                            value={item.materialId}
                            onValueChange={(value) => updateCreateItemRow(index, "materialId", value)}
                          >
                            <SelectTrigger className="w-full h-auto min-h-10 py-2 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal [&_[data-slot=select-value]]:break-words">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[360px]">
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id.toString()} className="h-auto py-2">
                                  {material.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => updateCreateItemRow(index, "quantity", event.target.value)}
                            placeholder="Qty"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 justify-self-end"
                            disabled={createItems.length <= 1}
                            onClick={() => removeCreateItemRow(index)}
                            aria-label="Remove item"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button type="button" variant="outline" onClick={addCreateItemRow}>
                        Add item
                      </Button>
                    </div>
                  </div>

                  {createError && <p className="text-sm text-destructive">{createError}</p>}

                  <SheetFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenCreateSheet(false)} disabled={creating}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create quotation"}
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          {loading && <QuotationsLoadingSkeleton />}

          {!loading && error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length > 0 ? (
                    filteredQuotations.map((quotation) => (
                      <TableRow
                        key={quotation.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/quotations/${quotation.id}`)}
                      >
                        <TableCell>{quotation.id}</TableCell>
                        <TableCell>{quotation.customers?.name ?? "-"}</TableCell>
                        <TableCell>{quotation.stores?.name ?? "-"}</TableCell>
                        <TableCell className="max-w-56 truncate">{quotation.notes ?? "-"}</TableCell>
                        <TableCell>{new Date(quotation.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No quotations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CustomerQuotationRedirect() {
  const { id } = useParams()
  const customerId = id && /^\d+$/.test(id) ? id : ""
  const to = customerId ? `/quotations?customerId=${customerId}` : "/quotations"

  return <Navigate to={to} replace />
}



function AppLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/quotations"
          element={<QuotationsPage />}
        />
        <Route
          path="/customer-quotations/:id"
          element={<CustomerQuotationRedirect />}
        />
        <Route
          path="/quotations/:id"
          element={<ViewQuotationPage />}
        />
        <Route
          path="/materials"
          element={<MaterialsPage />}
        />
        <Route
          path="/customers"
          element={<CustomersPage />}
        />
        <Route
          path="/stores"
          element={<StorePage/>}
        />
        <Route
          path="*"
          element={
            <SmallPage
              title="Page not found"
              subtitle="The requested route does not exist."
            />
          }
        />
      </Route>
    </Routes>
  )
}

export default App
