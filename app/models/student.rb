class Student < ApplicationRecord
  self.table_name = "tb_students"

  has_many :rents, dependent: :restrict_with_error

  validates :name, :classroom, :code, presence: true
  validates :code, uniqueness: { case_sensitive: false }

  scope :search, ->(term) {
    pattern = "%#{sanitize_sql_like(term)}%"
    where("tb_students.name ILIKE :p OR tb_students.code ILIKE :p OR tb_students.classroom ILIKE :p", p: pattern)
  }

  def as_json(*)
    super(only: %i[id name classroom code created_at updated_at])
  end
end
