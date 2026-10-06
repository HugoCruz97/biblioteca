class CreateLibraryTables < ActiveRecord::Migration[8.1]
  def change
    create_table :tb_students do |t|
      t.string :name, null: false
      t.string :classroom, null: false
      t.string :code, null: false, index: { unique: true }
      t.timestamps
    end

    create_table :tb_books do |t|
      t.string :code, null: false, index: { unique: true }
      t.string :title, null: false
      t.string :author, null: false
      t.string :publisher, null: false
      t.text :description
      t.integer :quantity, null: false, default: 1
      t.timestamps
    end
    add_check_constraint :tb_books, "quantity >= 0", name: "tb_books_quantity_non_negative"

    create_table :tb_rents do |t|
      t.references :book, null: false, foreign_key: { to_table: :tb_books }
      t.references :student, null: false, foreign_key: { to_table: :tb_students }
      t.integer :rent_time, null: false # loan length in days
      t.date :due_on, null: false
      t.datetime :returned_at
      t.integer :delay_time, null: false, default: 0 # days late, set on return
      t.timestamps
    end
    add_check_constraint :tb_rents, "rent_time > 0", name: "tb_rents_rent_time_positive"
    add_index :tb_rents, :returned_at
  end
end
