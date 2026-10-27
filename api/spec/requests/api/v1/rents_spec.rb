RSpec.describe "Rents API" do
  describe "GET /api/v1/rents" do
    let!(:active) { create(:rent) }
    let!(:late) { create(:rent, :late) }
    let!(:returned) { create(:rent, :returned) }

    it "lists every rent, newest first" do
      get "/api/v1/rents"

      expect(response).to have_http_status(:ok)
      expect(json.pluck("id")).to eq([ returned.id, late.id, active.id ])
    end

    it "filters by status" do
      get "/api/v1/rents", params: { status: "active" }
      expect(json.pluck("id")).to contain_exactly(active.id, late.id)

      get "/api/v1/rents", params: { status: "late" }
      expect(json.pluck("id")).to eq([ late.id ])

      get "/api/v1/rents", params: { status: "returned" }
      expect(json.pluck("id")).to eq([ returned.id ])
    end

    it "ignores an unknown status" do
      get "/api/v1/rents", params: { status: "lost" }

      expect(json.size).to eq(3)
    end

    it "filters by student and by book" do
      get "/api/v1/rents", params: { student_id: late.student_id }
      expect(json.pluck("id")).to eq([ late.id ])

      get "/api/v1/rents", params: { book_id: active.book_id }
      expect(json.pluck("id")).to eq([ active.id ])
    end

    it "embeds the book and the student without N+1 queries" do
      queries = 0
      counter = ->(*, payload) { queries += 1 unless payload[:name] == "SCHEMA" }
      ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { get "/api/v1/rents" }

      expect(json.first.keys).to include("book", "student", "status", "days_late")
      expect(queries).to eq(3) # rents, books, students
    end
  end

  describe "GET /api/v1/rents/:id" do
    it "returns the rent" do
      rent = create(:rent, :late)

      get "/api/v1/rents/#{rent.id}"

      expect(json).to include("id" => rent.id, "status" => "late", "days_late" => 3)
    end

    it "returns 404 with a translated message" do
      get "/api/v1/rents/0"

      expect(response).to have_http_status(:not_found)
      expect(json["error"]).to eq("Empréstimo não encontrado")
    end
  end

  describe "POST /api/v1/rents" do
    let(:book) { create(:book, quantity: 1) }
    let(:student) { create(:student) }

    def lend(**attrs)
      post "/api/v1/rents", params: { rent: { book_id: book.id, student_id: student.id, rent_time: 7 }.merge(attrs) },
                            as: :json
    end

    it "lends a book" do
      lend

      expect(response).to have_http_status(:created)
      expect(json).to include("status" => "active", "due_on" => (Date.current + 7).iso8601)
      expect(json.dig("book", "title")).to eq(book.title)
      expect(book.reload.available).to eq(0)
    end

    it "refuses an unavailable book with the reason" do
      create(:rent, book: book)

      lend

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]).to include("não tem exemplares disponíveis")
    end

    it "refuses an invalid rent_time" do
      lend(rent_time: Rent::MAX_DAYS + 1)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["details"]).to have_key("rent_time")
    end

    it "returns 404 for a book that doesn't exist" do
      lend(book_id: 0)

      expect(response).to have_http_status(:not_found)
      expect(json["error"]).to eq("Livro não encontrado")
    end

    it "returns 422 for a student that doesn't exist" do
      lend(student_id: 0)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["details"]).to have_key("student")
    end

    it "returns 400 when the rent key is missing" do
      post "/api/v1/rents", params: { book_id: book.id }

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/v1/rents/:id/return" do
    it "returns a book and refuses to return it twice" do
      rent = create(:rent)

      patch "/api/v1/rents/#{rent.id}/return"
      expect(response).to have_http_status(:ok)
      expect(json["status"]).to eq("returned")
      expect(rent.book.reload.available).to eq(1)

      patch "/api/v1/rents/#{rent.id}/return"
      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]).to eq("Este empréstimo já foi devolvido")
    end

    it "records the delay of a late return" do
      rent = create(:rent, :late)

      patch "/api/v1/rents/#{rent.id}/return"

      expect(json).to include("status" => "returned", "delay_time" => 3)
    end

    it "returns 404 for an unknown rent" do
      patch "/api/v1/rents/0/return"

      expect(response).to have_http_status(:not_found)
    end
  end
end
