RSpec.describe Book do
  describe "validations" do
    it "requires code, title, author and publisher" do
      book = described_class.new

      expect(book).not_to be_valid
      expect(book.errors.attribute_names).to contain_exactly(:author, :code, :publisher, :title)
    end

    it "keeps the code unique regardless of case" do
      create(:book, code: "abc-1")

      expect(build(:book, code: "ABC-1")).not_to be_valid
    end

    it "rejects a negative or fractional quantity" do
      expect(build(:book, quantity: -1)).not_to be_valid
      expect(build(:book, quantity: 1.5)).not_to be_valid
    end

    it "doesn't let quantity drop below the copies on loan" do
      book = create(:book, quantity: 2)
      create_list(:rent, 2, book: book)

      expect(book.update(quantity: 1)).to be(false)
      expect(book.errors).to be_of_kind(:quantity, :less_than_open_rents)
    end

    it "lets quantity drop to the copies on loan" do
      book = create(:book, quantity: 3)
      create(:rent, book: book)

      expect(book.update(quantity: 1)).to be(true)
    end
  end

  describe "#available" do
    it "subtracts active rents from quantity" do
      book = create(:book, quantity: 2)
      create(:rent, book: book)

      expect(book.reload.available).to eq(1)
    end

    it "ignores returned rents" do
      book = create(:book, quantity: 1)
      create(:rent, :returned, book: book)

      expect(book.reload.available).to eq(1)
    end
  end

  describe ".with_open_rents_count" do
    it "matches the per-record count without extra queries" do
      book = create(:book, quantity: 3)
      create(:rent, book: book)
      create(:rent, :returned, book: book)

      loaded = described_class.with_open_rents_count.find(book.id)

      expect(loaded.available).to eq(2)
      expect { loaded.available }.not_to make_database_queries
    end
  end

  describe ".search" do
    it "matches title, author or code, ignoring case" do
      by_title = create(:book, title: "Vidas Secas")
      by_author = create(:book, author: "Graciliano Ramos", title: "Angústia")
      by_code = create(:book, code: "LIT-42", title: "Outro")

      expect(described_class.search("secas")).to contain_exactly(by_title)
      expect(described_class.search("GRACILIANO")).to contain_exactly(by_author)
      expect(described_class.search("lit-4")).to contain_exactly(by_code)
    end

    it "treats % and _ as literal characters" do
      create(:book, title: "Dom Casmurro")
      percent = create(:book, title: "100% Machado")

      expect(described_class.search("%")).to contain_exactly(percent)
      expect(described_class.search("_")).to be_empty
    end
  end

  describe "#destroy" do
    it "is refused while the book has rents" do
      book = create(:book)
      create(:rent, :returned, book: book)

      expect(book.destroy).to be(false)
      expect(described_class).to exist(book.id)
    end
  end

  describe "#as_json" do
    it "exposes the public fields plus available" do
      expect(create(:book).as_json.keys).to contain_exactly(
        "id", "code", "title", "author", "publisher", "description", "quantity", "available",
        "created_at", "updated_at"
      )
    end
  end
end
