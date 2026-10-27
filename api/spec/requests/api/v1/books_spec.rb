RSpec.describe "Books API" do
  describe "GET /api/v1/books" do
    it "lists books ordered by title with availability" do
      create(:book, title: "Vidas Secas", quantity: 2)
      create(:book, title: "A Hora da Estrela")

      get "/api/v1/books"

      expect(response).to have_http_status(:ok)
      expect(json.pluck("title")).to eq([ "A Hora da Estrela", "Vidas Secas" ])
      expect(json.last["available"]).to eq(2)
    end

    it "searches by title, author or code and filters available ones" do
      create(:book, title: "Dom Casmurro", code: "LIT-1")
      create(:rent, book: create(:book, title: "Dom Quixote", author: "Cervantes", quantity: 1))
      create(:book, title: "Memórias Póstumas")

      get "/api/v1/books", params: { q: "dom" }
      expect(json.pluck("title")).to eq([ "Dom Casmurro", "Dom Quixote" ])

      get "/api/v1/books", params: { q: "dom", available: "true" }
      expect(json.pluck("title")).to eq([ "Dom Casmurro" ])
    end

    it "ignores available=false" do
      create(:rent, book: create(:book, quantity: 1))

      get "/api/v1/books", params: { available: "false" }

      expect(json.size).to eq(1)
    end
  end

  describe "GET /api/v1/books/:id" do
    it "returns the book" do
      book = create(:book, quantity: 2)
      create(:rent, book: book)

      get "/api/v1/books/#{book.id}"

      expect(response).to have_http_status(:ok)
      expect(json).to include("id" => book.id, "title" => book.title, "available" => 1)
    end

    it "returns 404 with a translated message" do
      get "/api/v1/books/0"

      expect(response).to have_http_status(:not_found)
      expect(json["error"]).to eq("Livro não encontrado")
    end
  end

  describe "POST /api/v1/books" do
    let(:attributes) { { code: "X1", title: "O Cortiço", author: "Aluísio Azevedo", publisher: "Garnier", quantity: 2 } }

    it "creates a book" do
      expect { post "/api/v1/books", params: { book: attributes }, as: :json }.to change(Book, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json).to include("title" => "O Cortiço", "available" => 2)
    end

    it "ignores attributes that aren't permitted" do
      post "/api/v1/books", params: { book: attributes.merge(id: 999, available: 50) }, as: :json

      expect(json["id"]).not_to eq(999)
      expect(json["available"]).to eq(2)
    end

    it "rejects invalid data with 422 and field errors" do
      post "/api/v1/books", params: { book: { title: "" } }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]).to be_present
      expect(json["details"].keys).to include("code", "title", "author", "publisher")
    end

    it "rejects a duplicated code" do
      create(:book, code: "X1")

      post "/api/v1/books", params: { book: attributes }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["details"]).to have_key("code")
    end

    # JSON bodies are wrapped under "book" automatically (wrap_parameters), so use form params here
    it "returns 400 when the book key is missing" do
      post "/api/v1/books", params: { title: "x" }

      expect(response).to have_http_status(:bad_request)
      expect(json["error"]).to be_present
    end
  end

  describe "PATCH /api/v1/books/:id" do
    it "updates a book" do
      book = create(:book)

      patch "/api/v1/books/#{book.id}", params: { book: { quantity: 5 } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(book.reload.quantity).to eq(5)
    end

    it "refuses a quantity below the copies on loan" do
      book = create(:book, quantity: 2)
      create_list(:rent, 2, book: book)

      patch "/api/v1/books/#{book.id}", params: { book: { quantity: 1 } }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["details"]).to have_key("quantity")
      expect(book.reload.quantity).to eq(2)
    end
  end

  describe "DELETE /api/v1/books/:id" do
    it "deletes a book without rents" do
      book = create(:book)

      delete "/api/v1/books/#{book.id}"

      expect(response).to have_http_status(:no_content)
      expect(Book).not_to exist(book.id)
    end

    it "refuses a book with rents with 409" do
      rent = create(:rent)

      delete "/api/v1/books/#{rent.book_id}"

      expect(response).to have_http_status(:conflict)
      expect(json["error"]).to be_present
      expect(Book).to exist(rent.book_id)
    end
  end
end
