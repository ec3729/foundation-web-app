import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin } from "lucide-react";
import { getAllZones } from "@/lib/supabase-storage";

export default function AdminPage() {
  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: getAllZones,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin: Google Maps Enrichment</h1>
          <p className="text-gray-600">
            Enrich business data with information from Google Maps.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> Google Maps enrichment requires a server-side API key and is not available in this environment.
            To enable it, implement an edge function with the Google Maps API key configured as a secret.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {zones?.map((zone) => (
            <Card key={zone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {zone.name}
                    </CardTitle>
                    <CardDescription>{zone.description}</CardDescription>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                  >
                    Enrich Zone (Disabled)
                  </button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
