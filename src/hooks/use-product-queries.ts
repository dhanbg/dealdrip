"use client";

import { useQuery } from "@tanstack/react-query";
import { dealDripApi } from "@/lib/api-client";

export function useBackendHealthQuery() {
  return useQuery({
    queryKey: ["backendHealth"],
    queryFn: () => dealDripApi.checkHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Background poll every minute
    retry: 0,
  });
}

export function useProductsQuery() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => dealDripApi.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
