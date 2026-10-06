class Rent < ApplicationRecord
  self.table_name = "tb_rents"

  MAX_DAYS = 30

  belongs_to :book
  belongs_to :student

  validates :rent_time, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: MAX_DAYS }
  validate :book_available, on: :create
  validate :student_has_no_open_rent_of_same_book, on: :create

  before_validation :set_due_on, on: :create

  scope :active, -> { where(returned_at: nil) }
  scope :returned, -> { where.not(returned_at: nil) }
  scope :late, -> { active.where(due_on: ...Date.current) }

  # Locks the book row so two simultaneous loans can't take the last copy.
  def self.lend!(attributes)
    transaction do
      Book.lock.find(attributes[:book_id]) if attributes[:book_id].present?
      create!(attributes)
    end
  end

  def return!
    if returned?
      errors.add(:base, :already_returned)
      raise ActiveRecord::RecordInvalid, self
    end

    update!(returned_at: Time.current, delay_time: days_late)
  end

  def returned?
    returned_at.present?
  end

  def late?
    days_late.positive?
  end

  def days_late
    reference = returned? ? returned_at.to_date : Date.current
    [ (reference - due_on).to_i, 0 ].max
  end

  def status
    return "returned" if returned?

    late? ? "late" : "active"
  end

  def as_json(*)
    super(only: %i[id rent_time due_on returned_at delay_time created_at])
      .merge(
        "status" => status,
        "days_late" => days_late,
        "book" => book.slice(:id, :code, :title),
        "student" => student.slice(:id, :code, :name, :classroom)
      )
  end

  private

  def set_due_on
    self.due_on = Date.current + rent_time.to_i.days if rent_time.present?
  end

  def book_available
    errors.add(:book, :unavailable) if book && book.available <= 0
  end

  def student_has_no_open_rent_of_same_book
    return unless book && student

    errors.add(:book, :already_rented_by_student) if Rent.active.exists?(book: book, student: student)
  end
end
