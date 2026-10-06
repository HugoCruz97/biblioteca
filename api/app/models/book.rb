class Book < ApplicationRecord
  self.table_name = "tb_books"

  has_many :rents, dependent: :restrict_with_error

  validates :code, :title, :author, :publisher, presence: true
  validates :code, uniqueness: { case_sensitive: false }
  validates :quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :quantity_covers_open_rents, if: :quantity_changed?

  # Adds an `open_rents_count` column so `available` doesn't need one query per book.
  scope :with_open_rents_count, -> {
    select("tb_books.*", <<~SQL.squish)
      (SELECT COUNT(*) FROM tb_rents
        WHERE tb_rents.book_id = tb_books.id AND tb_rents.returned_at IS NULL) AS open_rents_count
    SQL
  }
  scope :search, ->(term) {
    pattern = "%#{sanitize_sql_like(term)}%"
    where("tb_books.title ILIKE :p OR tb_books.author ILIKE :p OR tb_books.code ILIKE :p", p: pattern)
  }

  def open_rents_count
    has_attribute?(:open_rents_count) ? self[:open_rents_count] : rents.active.count
  end

  def available
    quantity - open_rents_count
  end

  def as_json(*)
    super(only: %i[id code title author publisher description quantity created_at updated_at])
      .merge("available" => available)
  end

  private

  def quantity_covers_open_rents
    return if new_record? || quantity.nil?

    open = rents.active.count
    errors.add(:quantity, :less_than_open_rents, count: open) if quantity < open
  end
end
