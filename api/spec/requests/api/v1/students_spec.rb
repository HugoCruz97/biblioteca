RSpec.describe "Students API" do
  describe "GET /api/v1/students" do
    it "lists students ordered by name and searches them" do
      create(:student, name: "Bruno Carvalho")
      create(:student, name: "Ana Lima", classroom: "8º B")

      get "/api/v1/students"
      expect(response).to have_http_status(:ok)
      expect(json.pluck("name")).to eq([ "Ana Lima", "Bruno Carvalho" ])

      get "/api/v1/students", params: { q: "8º" }
      expect(json.pluck("name")).to eq([ "Ana Lima" ])
    end
  end

  describe "GET /api/v1/students/:id" do
    it "returns the student" do
      student = create(:student)

      get "/api/v1/students/#{student.id}"

      expect(json).to include("id" => student.id, "name" => student.name, "code" => student.code)
    end

    it "returns 404 with a translated message" do
      get "/api/v1/students/0"

      expect(response).to have_http_status(:not_found)
      expect(json["error"]).to eq("Aluno não encontrado")
    end
  end

  describe "POST /api/v1/students" do
    let(:attributes) { { name: "Carla", classroom: "7º C", code: "123" } }

    it "creates a student" do
      post "/api/v1/students", params: { student: attributes }, as: :json

      expect(response).to have_http_status(:created)
      expect(json).to include("name" => "Carla", "classroom" => "7º C")
    end

    it "refuses a duplicated code" do
      create(:student, code: "123")

      post "/api/v1/students", params: { student: attributes }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["details"]).to have_key("code")
    end

    it "returns 400 when the student key is missing" do
      post "/api/v1/students", params: { name: "x" }

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/v1/students/:id" do
    it "updates a student" do
      student = create(:student)

      patch "/api/v1/students/#{student.id}", params: { student: { classroom: "8º C" } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(json["classroom"]).to eq("8º C")
    end

    it "rejects a blank name" do
      student = create(:student)

      patch "/api/v1/students/#{student.id}", params: { student: { name: "" } }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["details"]).to have_key("name")
    end
  end

  describe "DELETE /api/v1/students/:id" do
    it "deletes a student without rents" do
      student = create(:student)

      delete "/api/v1/students/#{student.id}"

      expect(response).to have_http_status(:no_content)
    end

    it "refuses a student with rents with 409" do
      rent = create(:rent)

      delete "/api/v1/students/#{rent.student_id}"

      expect(response).to have_http_status(:conflict)
      expect(Student).to exist(rent.student_id)
    end
  end
end
