require "test_helper"

class RentTest < ActiveSupport::TestCase
  test "lend! sets the due date from rent_time" do
    rent = lend(rent_time: 10)
    assert_equal Date.current + 10, rent.due_on
    assert_equal "active", rent.status
  end

  test "can't lend a book with no copies available" do
    book = create_book(quantity: 1)
    lend(book: book)
    error = assert_raises(ActiveRecord::RecordInvalid) { lend(book: book) }
    assert error.record.errors.of_kind?(:book, :unavailable)
  end

  test "a student can't borrow the same book twice at the same time" do
    book = create_book(quantity: 2)
    student = create_student
    lend(book: book, student: student)
    error = assert_raises(ActiveRecord::RecordInvalid) { lend(book: book, student: student) }
    assert error.record.errors.of_kind?(:book, :already_rented_by_student)
  end

  test "rent_time must be between 1 and MAX_DAYS" do
    assert_raises(ActiveRecord::RecordInvalid) { lend(rent_time: 0) }
    assert_raises(ActiveRecord::RecordInvalid) { lend(rent_time: Rent::MAX_DAYS + 1) }
  end

  test "is late after the due date" do
    rent = lend(rent_time: 7)
    rent.update_columns(due_on: 3.days.ago.to_date)
    assert_equal "late", rent.status
    assert_equal 3, rent.days_late
    assert_includes Rent.late, rent
  end

  test "return! records the delay and frees the copy" do
    book = create_book(quantity: 1)
    rent = lend(book: book)
    rent.update_columns(due_on: 2.days.ago.to_date)

    rent.return!

    assert_equal "returned", rent.status
    assert_equal 2, rent.delay_time
    assert_equal 1, book.reload.available
  end

  test "can't return twice" do
    rent = lend
    rent.return!
    assert_raises(ActiveRecord::RecordInvalid) { rent.return! }
  end
end
