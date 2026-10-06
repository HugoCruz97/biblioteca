import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Book, BookInput, Rent, RentInput, RentStatus, Student, StudentInput } from './types'

export const keys = {
  books: ['books'] as const,
  students: ['students'] as const,
  rents: ['rents'] as const,
}

export function useBooks(params: { q?: string; available?: boolean } = {}) {
  return useQuery({
    queryKey: [...keys.books, params],
    queryFn: () => api.get<Book[]>('/books', params),
  })
}

export function useStudents(params: { q?: string } = {}) {
  return useQuery({
    queryKey: [...keys.students, params],
    queryFn: () => api.get<Student[]>('/students', params),
  })
}

export function useRents(params: { status?: RentStatus } = {}) {
  return useQuery({
    queryKey: [...keys.rents, params],
    queryFn: () => api.get<Rent[]>('/rents', params),
  })
}

// Loans change book availability, so book lists are refreshed together with rents.
function useInvalidate(...groups: (readonly string[])[]) {
  const client = useQueryClient()
  return () => Promise.all(groups.map((queryKey) => client.invalidateQueries({ queryKey })))
}

export function useSaveBook() {
  const invalidate = useInvalidate(keys.books)
  return useMutation({
    mutationFn: ({ id, ...book }: BookInput & { id?: number }) =>
      id ? api.patch<Book>(`/books/${id}`, { book }) : api.post<Book>('/books', { book }),
    onSuccess: invalidate,
  })
}

export function useDeleteBook() {
  const invalidate = useInvalidate(keys.books)
  return useMutation({ mutationFn: (id: number) => api.delete(`/books/${id}`), onSuccess: invalidate })
}

export function useSaveStudent() {
  const invalidate = useInvalidate(keys.students, keys.rents)
  return useMutation({
    mutationFn: ({ id, ...student }: StudentInput & { id?: number }) =>
      id ? api.patch<Student>(`/students/${id}`, { student }) : api.post<Student>('/students', { student }),
    onSuccess: invalidate,
  })
}

export function useDeleteStudent() {
  const invalidate = useInvalidate(keys.students)
  return useMutation({ mutationFn: (id: number) => api.delete(`/students/${id}`), onSuccess: invalidate })
}

export function useLendBook() {
  const invalidate = useInvalidate(keys.rents, keys.books)
  return useMutation({
    mutationFn: (rent: RentInput) => api.post<Rent>('/rents', { rent }),
    onSuccess: invalidate,
  })
}

export function useReturnBook() {
  const invalidate = useInvalidate(keys.rents, keys.books)
  return useMutation({
    mutationFn: (id: number) => api.patch<Rent>(`/rents/${id}/return`),
    onSuccess: invalidate,
  })
}
