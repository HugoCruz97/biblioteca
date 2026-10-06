require "test_helper"

class RentsApiTest < ActionDispatch::IntegrationTest
  test "lends a book" do
    book = create_book(quantity: 1)
    student = create_student

    post "/api/v1/rents", params: { rent: { book_id: book.id, student_id: student.id, rent_time: 7 } }, as: :json

    assert_response :created
    assert_equal "active", json["status"]
    assert_equal book.title, json.dig("book", "title")
    assert_equal 0, book.reload.available
  end

  test "refuses to lend an unavailable book" do
    book = create_book(quantity: 1)
    lend(book: book)

    post "/api/v1/rents", params: { rent: { book_id: book.id, student_id: create_student.id, rent_time: 7 } }, as: :json

    assert_response :unprocessable_content
  end

  test "returns 404 when lending a book that doesn't exist" do
    post "/api/v1/rents", params: { rent: { book_id: 0, student_id: create_student.id, rent_time: 7 } }, as: :json
    assert_response :not_found
  end

  test "filters rents by status" do
    active = lend
    late = lend
    late.update_columns(due_on: 1.day.ago.to_date)
    lend.return!

    get "/api/v1/rents", params: { status: "active" }
    assert_equal [ late.id, active.id ].sort, json.pluck("id").sort

    get "/api/v1/rents", params: { status: "late" }
    assert_equal [ late.id ], json.pluck("id")

    get "/api/v1/rents", params: { status: "returned" }
    assert_equal 1, json.size
  end

  test "returns a book and refuses to return it twice" do
    rent = lend

    patch "/api/v1/rents/#{rent.id}/return"
    assert_response :ok
    assert_equal "returned", json["status"]

    patch "/api/v1/rents/#{rent.id}/return"
    assert_response :unprocessable_content
  end
end
