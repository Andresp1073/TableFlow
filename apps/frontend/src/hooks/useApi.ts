import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import type { ApiResponse } from '@/services';

export function useApiQuery<T>(
  key: string[],
  fn: () => Promise<ApiResponse<T>>,
  options?: Omit<UseQueryOptions<ApiResponse<T>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ApiResponse<T>>({
    queryKey: key,
    queryFn: fn,
    ...options,
  });
}

export function useApiMutation<T, V>(
  fn: (variables: V) => Promise<ApiResponse<T>>,
  options?: Omit<UseMutationOptions<ApiResponse<T>, Error, V>, 'mutationFn'>,
) {
  return useMutation<ApiResponse<T>, Error, V>({
    mutationFn: fn,
    ...options,
  });
}
