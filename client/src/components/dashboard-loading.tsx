import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Skeleton */}
      <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6">
        <Skeleton className="h-8 w-32 bg-gray-800" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-24 bg-gray-800" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2 bg-gray-800" />
          <Skeleton className="h-4 w-96 bg-gray-800" />
        </div>

        <div className="space-y-8">
          
          {/* Validation Overview Skeleton */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-gray-800" />
              <Skeleton className="h-4 w-72 bg-gray-800" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3 bg-gray-800" />
                    <Skeleton className="h-6 w-20 mx-auto mb-2 bg-gray-800" />
                    <Skeleton className="h-4 w-32 mx-auto bg-gray-800" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-2 w-full bg-gray-800" />
              <Skeleton className="h-4 w-64 bg-gray-800" />
            </CardContent>
          </Card>

          {/* Deal Room Section Skeleton */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-36 bg-gray-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-3 bg-gray-800" />
              <Skeleton className="h-4 w-32 mb-4 bg-gray-800" />
              <Skeleton className="h-10 w-40 bg-gray-800" />
            </CardContent>
          </Card>

          {/* ProofVault Section Skeleton */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-40 bg-gray-800" />
              <Skeleton className="h-4 w-64 bg-gray-800" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 border border-gray-700 rounded-lg text-center">
                    <Skeleton className="h-8 w-8 mx-auto mb-2 bg-gray-800" />
                    <Skeleton className="h-4 w-16 mx-auto mb-1 bg-gray-800" />
                    <Skeleton className="h-6 w-8 mx-auto bg-gray-800" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Downloads Section Skeleton */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-56 bg-gray-800" />
              <Skeleton className="h-4 w-80 bg-gray-800" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 border border-gray-700 rounded-lg">
                    <Skeleton className="h-6 w-32 mb-2 bg-gray-800" />
                    <Skeleton className="h-4 w-48 mb-3 bg-gray-800" />
                    <Skeleton className="h-10 w-full bg-gray-800" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Skeleton */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-gray-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-6 bg-gray-800" />
                    <Skeleton className="h-4 w-24 bg-gray-800" />
                    <Skeleton className="h-4 w-8 ml-auto bg-gray-800" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Skeleton */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-gray-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 bg-gray-800" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1 bg-gray-800" />
                      <Skeleton className="h-3 w-20 bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}