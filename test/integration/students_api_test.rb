require "test_helper"

class StudentsApiTest < ActionDispatch::IntegrationTest
  test "lists and searches students" do
    create_student(name: "Bruno Carvalho")
    create_student(name: "Ana Lima", classroom: "8º B")

    get "/api/v1/students"
    assert_equal [ "Ana Lima", "Bruno Carvalho" ], json.pluck("name")

    get "/api/v1/students", params: { q: "8º" }
    assert_equal [ "Ana Lima" ], json.pluck("name")
  end

  test "creates, updates and deletes a student" do
    post "/api/v1/students", params: { student: { name: "Carla", classroom: "7º C", code: "123" } }, as: :json
    assert_response :created
    id = json["id"]

    patch "/api/v1/students/#{id}", params: { student: { classroom: "8º C" } }, as: :json
    assert_equal "8º C", json["classroom"]

    delete "/api/v1/students/#{id}"
    assert_response :no_content
  end

  test "refuses a duplicated code" do
    create_student(code: "123")
    post "/api/v1/students", params: { student: { name: "Carla", classroom: "7º C", code: "123" } }, as: :json
    assert_response :unprocessable_content
  end

  test "refuses to delete a student with rents" do
    student = create_student
    lend(student: student)
    delete "/api/v1/students/#{student.id}"
    assert_response :conflict
  end
end
