import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCurrentUser, login, register } from '@/api/auth'
import { clearStoredToken, getStoredToken, setStoredToken } from './token-storage'

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'] as const

export function useAuth() {
  const queryClient = useQueryClient()
  const hasToken = Boolean(getStoredToken())

  const currentUserQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: hasToken,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      setStoredToken(result.accessToken)
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
  })

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (result) => {
      setStoredToken(result.accessToken)
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
  })

  function logout() {
    clearStoredToken()
    queryClient.clear()
  }

  return {
    user: currentUserQuery.data,
    isLoadingUser: currentUserQuery.isLoading,
    hasToken,
    loginMutation,
    registerMutation,
    logout,
  }
}
