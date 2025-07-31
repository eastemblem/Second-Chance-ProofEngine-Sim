import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FileItem {
  id: string;
  name: string;
  fileType: string;
  createdAt: string;
  category: string;
  categoryName: string;
  size: number;
  downloadUrl: string;
  eastemblemFileId: string;
}

interface FilesResponse {
  files: FileItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalFiles: number;
    hasMore: boolean;
    limit: number;
  };
}

export function usePaginatedFiles() {
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
  } = useInfiniteQuery<FilesResponse>({
    queryKey: ['/api/v1/vault/files'],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await apiRequest('GET', `/api/v1/vault/files?page=${pageParam}&limit=10`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error('Files fetch error:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    retry: 3,
    retryDelay: 1000,
  });

  // Flatten all files from all pages
  const allFiles = data?.pages.flatMap(page => page.files) || [];
  const totalFiles = data?.pages[0]?.pagination.totalFiles || 0;

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
    files: allFiles,
    totalFiles,
    isLoading,
    isError,
    error,
    loadMore,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage || isLoadingMore,
    refetch
  };
}