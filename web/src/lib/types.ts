export type Book = {
  id: number
  code: string
  title: string
  author: string
  publisher: string
  description: string | null
  quantity: number
  available: number
  created_at: string
  updated_at: string
}

export type Student = {
  id: number
  code: string
  name: string
  classroom: string
  created_at: string
  updated_at: string
}

export type RentStatus = 'active' | 'late' | 'returned'

export type Rent = {
  id: number
  rent_time: number
  due_on: string
  returned_at: string | null
  delay_time: number
  days_late: number
  status: RentStatus
  created_at: string
  book: Pick<Book, 'id' | 'code' | 'title'>
  student: Pick<Student, 'id' | 'code' | 'name' | 'classroom'>
}

export type BookInput = Pick<Book, 'code' | 'title' | 'author' | 'publisher' | 'quantity'> & {
  description?: string
}
export type StudentInput = Pick<Student, 'code' | 'name' | 'classroom'>
export type RentInput = { book_id: number; student_id: number; rent_time: number }
