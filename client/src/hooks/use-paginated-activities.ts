import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface ActivityResponse {
  activities: Activity[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalActivities: number;
    hasMore: boolean;
    limit: number;
  };
}

export function usePaginatedActivities() {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery<ActivityResponse>({
    queryKey: ['/api/v1/dashboard/activity'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest('GET', `/api/v1/dashboard/activity?page=${pageParam}&limit=10`);
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all activities from all pages
  const allActivities = data?.pages.flatMap(page => page.activities) || [];
  const totalActivities = data?.pages[0]?.pagination.totalActivities || 0;

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await fetchNextPage();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasNextPage, isFetchingNextPage, isLoadingMore, fetchNextPage]);

  return {
    activities: allActivities,
    totalActivities,
    isLoading,
    isError,
    error,
    loadMore,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage || isLoadingMore,
    refetch
  };
}