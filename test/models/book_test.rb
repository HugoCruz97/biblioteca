require "test_helper"

class BookTest < ActiveSupport::TestCase
  test "requires code, title, author and publisher" do
    book = Book.new
    assert_not book.valid?
    assert_equal %i[author code publisher title], book.errors.attribute_names.sort
  end

  test "code is unique regardless of case" do
    create_book(code: "abc-1")
    assert_not Book.new(code: "ABC-1", title: "x", author: "x", publisher: "x").valid?
  end

  test "available subtracts active rents from quantity" do
    book = create_book(quantity: 2)
    lend(book: book)
    assert_equal 1, book.reload.available
  end

  test "with_open_rents_count matches the per-record count" do
    book = create_book(quantity: 3)
    lend(book: book)
    lend(book: book).return!
    assert_equal 2, Book.with_open_rents_count.find(book.id).available
  end

  test "quantity can't drop below copies on loan" do
    book = create_book(quantity: 2)
    lend(book: book)
    lend(book: book)
    assert_not book.update(quantity: 1)
    assert book.errors.of_kind?(:quantity, :less_than_open_rents)
  end

  test "can't be destroyed while it has rents" do
    book = create_book
    lend(book: book)
    assert_not book.destroy
    assert Book.exists?(book.id)
  end
end
