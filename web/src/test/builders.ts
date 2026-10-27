import type { Book, Rent, Student } from '@/lib/types'

let nextId = 1
const timestamps = { created_at: '2026-10-01T10:00:00-03:00', updated_at: '2026-10-01T10:00:00-03:00' }

export function buildBook(overrides: Partial<Book> = {}): Book {
  const id = overrides.id ?? nextId++
  return {
    id,
    code: `B-${id}`,
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    publisher: 'Garnier',
    description: null,
    quantity: 1,
    available: 1,
    ...timestamps,
    ...overrides,
  }
}

export function buildStudent(overrides: Partial<Student> = {}): Student {
  const id = overrides.id ?? nextId++
  return { id, code: `S-${id}`, name: 'Ana Lima', classroom: '9º A', ...timestamps, ...overrides }
}

export function buildRent(overrides: Partial<Rent> = {}): Rent {
  const book = buildBook()
  const student = buildStudent()
  return {
    id: nextId++,
    rent_time: 7,
    due_on: '2026-10-08',
    returned_at: null,
    delay_time: 0,
    days_late: 0,
    status: 'active',
    created_at: timestamps.created_at,
    book: { id: book.id, code: book.code, title: book.title },
    student: { id: student.id, code: student.code, name: student.name, classroom: student.classroom },
    ...overrides,
  }
}
