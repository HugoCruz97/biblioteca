# Sample data for local development. Idempotent: safe to run more than once.

books = [
  { code: "LIT-001", title: "Dom Casmurro", author: "Machado de Assis", publisher: "Garnier", quantity: 3,
    description: "Bentinho revisita o passado e o ciúme que marcou seu casamento com Capitu." },
  { code: "LIT-002", title: "Memórias Póstumas de Brás Cubas", author: "Machado de Assis", publisher: "Garnier", quantity: 2,
    description: "Um defunto autor narra a própria vida com ironia." },
  { code: "LIT-003", title: "O Cortiço", author: "Aluísio Azevedo", publisher: "Garnier", quantity: 2,
    description: "Retrato naturalista de um cortiço no Rio de Janeiro do século XIX." },
  { code: "LIT-004", title: "Vidas Secas", author: "Graciliano Ramos", publisher: "José Olympio", quantity: 4,
    description: "A jornada de uma família de retirantes pelo sertão." },
  { code: "LIT-005", title: "A Hora da Estrela", author: "Clarice Lispector", publisher: "José Olympio", quantity: 1,
    description: "A história de Macabéa, narrada por Rodrigo S.M." },
  { code: "INF-001", title: "O Pequeno Príncipe", author: "Antoine de Saint-Exupéry", publisher: "Agir", quantity: 5,
    description: "Um piloto perdido no deserto conhece um pequeno príncipe." }
].map { |attrs| Book.find_or_create_by!(code: attrs[:code]) { |b| b.assign_attributes(attrs) } }

students = [
  { code: "2025001", name: "Ana Beatriz Lima", classroom: "9º A" },
  { code: "2025002", name: "Bruno Carvalho", classroom: "9º A" },
  { code: "2025003", name: "Carla Mendes", classroom: "8º B" },
  { code: "2025004", name: "Diego Rocha", classroom: "7º C" }
].map { |attrs| Student.find_or_create_by!(code: attrs[:code]) { |s| s.assign_attributes(attrs) } }

if Rent.none?
  Rent.lend!(book_id: books[0].id, student_id: students[0].id, rent_time: 14)
  Rent.lend!(book_id: books[3].id, student_id: students[1].id, rent_time: 7)

  # A late loan and a returned one, so every status shows up in the UI
  late = Rent.lend!(book_id: books[4].id, student_id: students[2].id, rent_time: 7)
  late.update_columns(created_at: 12.days.ago, due_on: 5.days.ago.to_date)

  returned = Rent.lend!(book_id: books[1].id, student_id: students[3].id, rent_time: 10)
  returned.update_columns(created_at: 20.days.ago, due_on: 10.days.ago.to_date)
  returned.return!
end
