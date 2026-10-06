require "test_helper"

class BooksApiTest < ActionDispatch::IntegrationTest
  test "lists books ordered by title with availability" do
    create_book(title: "Vidas Secas", quantity: 2)
    create_book(title: "A Hora da Estrela")

    get "/api/v1/books"

    assert_response :ok
    assert_equal [ "A Hora da Estrela", "Vidas Secas" ], json.pluck("title")
    assert_equal 2, json.last["available"]
  end

  test "searches by title, author or code and filters available ones" do
    create_book(title: "Dom Casmurro", code: "LIT-1")
    lend(book: create_book(title: "Dom Quixote", author: "Cervantes", quantity: 1))

    get "/api/v1/books", params: { q: "dom" }
    assert_equal 2, json.size

    get "/api/v1/books", params: { q: "dom", available: "true" }
    assert_equal [ "Dom Casmurro" ], json.pluck("title")
  end

  test "creates a book" do
    post "/api/v1/books", params: { book: { code: "X1", title: "O Cortiço", author: "Aluísio Azevedo",
                                            publisher: "Garnier", quantity: 2 } }, as: :json

    assert_response :created
    assert_equal "O Cortiço", json["title"]
    assert_equal 2, json["available"]
  end

  test "rejects invalid data with 422 and field errors" do
    post "/api/v1/books", params: { book: { title: "" } }, as: :json

    assert_response :unprocessable_content
    assert json["details"].key?("code")
  end

  # JSON bodies are wrapped under "book" automatically (wrap_parameters), so use form params here
  test "returns 400 when the book key is missing" do
    post "/api/v1/books", params: { title: "x" }
    assert_response :bad_request
  end

  test "updates a book" do
    book = create_book
    patch "/api/v1/books/#{book.id}", params: { book: { quantity: 5 } }, as: :json

    assert_response :ok
    assert_equal 5, book.reload.quantity
  end

  test "deletes a book without rents and refuses one with rents" do
    free = create_book
    delete "/api/v1/books/#{free.id}"
    assert_response :no_content

    rented = create_book
    lend(book: rented)
    delete "/api/v1/books/#{rented.id}"
    assert_response :conflict
  end

  test "returns 404 for an unknown book" do
    get "/api/v1/books/0"
    assert_response :not_found
  end
end
