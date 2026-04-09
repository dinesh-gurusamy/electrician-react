import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Material type based on API response
 */
export type Material = {
  id: number
  name: string
  description: string | null
  image_url: string | null
  created_at: string
  category_id: number | null
}

type MaterialsApiResponse = {
  materials: Material[]
}

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL ?? "/api")
const MATERIALS_API_URL = `${API_BASE_URL}/materials`

/**
 * MaterialsPage component displays a grid of materials with search functionality
 */
export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const loadMaterials = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(MATERIALS_API_URL, { signal })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const result = (await response.json()) as MaterialsApiResponse
      setMaterials(Array.isArray(result.materials) ? result.materials : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }
      console.error("Fetch error:", err)
      setError("Unable to fetch materials. Please check if the API is running.")
      toast.error("Failed to fetch materials")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadMaterials(controller.signal)
    return () => controller.abort()
  }, [loadMaterials])

  const filteredMaterials = useMemo(() => {
    const term = searchQuery.toLowerCase().trim()
    if (!term) return materials
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.description && m.description.toLowerCase().includes(term))
    )
  }, [materials, searchQuery])

  function MaterialsLoadingSkeleton() {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Materials Catalog</h1>
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {loading ? (
        <MaterialsLoadingSkeleton />
      ) : error ? (
        <Card className="flex h-[400px] items-center justify-center border-dashed">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => loadMaterials()}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </Card>
      ) : (
        <>
          {filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMaterials.map((material) => (
                <Card
                  key={material.id}
                  className="group overflow-hidden transition-all hover:shadow-lg"
                >
                  <div className="aspect-square relative bg-muted overflow-hidden">
                    <img
                      src={material.image_url || "/placeholder-material.jpg"}
                      alt={material.name}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          "https://placehold.co/400x400/e2e8f0/64748b?text=Material"
                      }}
                    />
                    {material.category_id && (
                      <Badge className="absolute top-2 right-2 shadow-sm">
                        Category: {material.category_id}
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {material.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {material.description || "No description available."}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                      <span className="font-mono">ID: {material.id}</span>
                      <span>
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex h-[400px] items-center justify-center border-dashed">
              <p className="text-muted-foreground">No materials found matching your search.</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
