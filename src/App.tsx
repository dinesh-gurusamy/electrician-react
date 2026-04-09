import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import { Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, schema } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input";
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
import data from "@/app/dashboard/data.json"
import { CustomersPage } from "./customer"
import { StorePage} from "./store";
import { MaterialsPage } from "./materials";

const tableData = schema.array().parse(data)
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL ?? "/api")
const QUOTATIONS_API_URL = `${API_BASE_URL}/quotations`
const QUOTATION_ITEMS_API_URL = `${API_BASE_URL}/quotations`

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

        const response = await fetch(`${QUOTATION_ITEMS_API_URL}/${id}`, {
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

  return (
    <div className="flex flex-1 items-start p-4 lg:p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{`Quotation #${id ?? "-"}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <QuotationDetailsSkeleton />}

          {!loading && error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && quotation && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Electrician</p>
                  <p className="text-sm font-medium">{quotation.electricians?.name ?? "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{quotation.customers?.name ?? "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Store</p>
                  <p className="text-sm font-medium">{quotation.stores?.name ?? "-"}</p>
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
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

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
    return () => controller.abort()
  }, [loadQuotations])

  const filteredQuotations = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return quotations.filter((quotation) => {
      const createdAt = new Date(quotation.created_at)
      if (from && createdAt < from) {
        return false
      }
      if (to && createdAt > to) {
        return false
      }
      return true
    })
  }, [quotations, fromDate, toDate])

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
              }}
            >
              Clear filter
            </Button>
          </div>

          {loading && <QuotationsLoadingSkeleton />}

          {!loading && error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Electrician</TableHead>
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
                        <TableCell>{quotation.electricians?.name ?? "-"}</TableCell>
                        <TableCell>{quotation.customers?.name ?? "-"}</TableCell>
                        <TableCell>{quotation.stores?.name ?? "-"}</TableCell>
                        <TableCell className="max-w-56 truncate">{quotation.notes ?? "-"}</TableCell>
                        <TableCell>{new Date(quotation.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
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
