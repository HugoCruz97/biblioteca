ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    def create_book(**attrs)
      Book.create!({ code: "B-#{SecureRandom.hex(3)}", title: "Dom Casmurro", author: "Machado de Assis",
                     publisher: "Garnier", quantity: 1 }.merge(attrs))
    end

    def create_student(**attrs)
      Student.create!({ code: "S-#{SecureRandom.hex(3)}", name: "Ana Lima", classroom: "9º A" }.merge(attrs))
    end

    def lend(book: create_book, student: create_student, rent_time: 7)
      Rent.lend!(book_id: book.id, student_id: student.id, rent_time: rent_time)
    end
  end
end

class ActionDispatch::IntegrationTest
  def json
    response.parsed_body
  end
end
