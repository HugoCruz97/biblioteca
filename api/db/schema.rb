# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_10_26_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "tb_books", force: :cascade do |t|
    t.string "author", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "publisher", null: false
    t.integer "quantity", default: 1, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_tb_books_on_code", unique: true
    t.check_constraint "quantity >= 0", name: "tb_books_quantity_non_negative"
  end

  create_table "tb_rents", force: :cascade do |t|
    t.bigint "book_id", null: false
    t.datetime "created_at", null: false
    t.integer "delay_time", default: 0, null: false
    t.date "due_on", null: false
    t.integer "rent_time", null: false
    t.datetime "returned_at"
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["book_id"], name: "index_tb_rents_on_book_id"
    t.index ["returned_at"], name: "index_tb_rents_on_returned_at"
    t.index ["student_id"], name: "index_tb_rents_on_student_id"
    t.check_constraint "rent_time > 0", name: "tb_rents_rent_time_positive"
  end

  create_table "tb_students", force: :cascade do |t|
    t.string "classroom", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_tb_students_on_code", unique: true
  end

  add_foreign_key "tb_rents", "tb_books", column: "book_id"
  add_foreign_key "tb_rents", "tb_students", column: "student_id"
end
