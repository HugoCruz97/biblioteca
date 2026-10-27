RSpec.describe Rent do
  describe ".lend!" do
    let(:book) { create(:book, quantity: 1) }
    let(:student) { create(:student) }

    def lend(**attrs)
      described_class.lend!({ book_id: book.id, student_id: student.id, rent_time: 7 }.merge(attrs))
    end

    it "sets the due date from rent_time" do
      rent = lend(rent_time: 10)

      expect(rent.due_on).to eq(Date.current + 10)
      expect(rent.status).to eq("active")
    end

    it "refuses a book with no copies available" do
      create(:rent, book: book)

      expect { lend(student_id: create(:student).id) }.to raise_error(ActiveRecord::RecordInvalid) { |error|
        expect(error.record.errors).to be_of_kind(:book, :unavailable)
      }
    end

    it "refuses the same book twice to one student" do
      book.update!(quantity: 2)
      lend

      expect { lend }.to raise_error(ActiveRecord::RecordInvalid) { |error|
        expect(error.record.errors).to be_of_kind(:book, :already_rented_by_student)
      }
    end

    it "lets the student borrow the book again after returning it" do
      lend.return!

      expect(lend).to be_persisted
    end

    it "raises RecordNotFound for an unknown book" do
      expect { lend(book_id: 0) }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "locks the book row before creating the rent" do
      expect(Book).to receive(:lock).and_call_original

      lend
    end

    it "accepts rent_time between 1 and MAX_DAYS" do
      expect { lend(rent_time: 0) }.to raise_error(ActiveRecord::RecordInvalid)
      expect { lend(rent_time: Rent::MAX_DAYS + 1) }.to raise_error(ActiveRecord::RecordInvalid)
      expect(lend(rent_time: Rent::MAX_DAYS)).to be_persisted
    end
  end

  describe "#status and #days_late" do
    it "is active before the due date" do
      rent = create(:rent)

      expect(rent.status).to eq("active")
      expect(rent.days_late).to eq(0)
    end

    it "is still active on the due date itself" do
      rent = create(:rent, rent_time: 7)

      travel_to(rent.due_on) { expect(rent.status).to eq("active") }
    end

    it "is late after the due date" do
      rent = create(:rent, :late)

      expect(rent.status).to eq("late")
      expect(rent.days_late).to eq(3)
      expect(described_class.late).to include(rent)
    end

    it "counts the delay up to the return date, not today" do
      rent = create(:rent, rent_time: 7)
      travel_to(rent.due_on + 2) { rent.return! }

      expect(rent.status).to eq("returned")
      expect(rent.days_late).to eq(2)
    end
  end

  describe "scopes" do
    it "splits rents into active, late and returned" do
      active = create(:rent)
      late = create(:rent, :late)
      returned = create(:rent, :returned)

      expect(described_class.active).to contain_exactly(active, late)
      expect(described_class.late).to contain_exactly(late)
      expect(described_class.returned).to contain_exactly(returned)
    end
  end

  describe "#return!" do
    it "records the delay and frees the copy" do
      book = create(:book, quantity: 1)
      rent = create(:rent, :late, book: book)

      rent.return!

      expect(rent.returned_at).to be_present
      expect(rent.delay_time).to eq(3)
      expect(book.reload.available).to eq(1)
    end

    it "can't happen twice" do
      rent = create(:rent, :returned)

      expect { rent.return! }.to raise_error(ActiveRecord::RecordInvalid) { |error|
        expect(error.record.errors).to be_of_kind(:base, :already_returned)
      }
    end
  end

  describe "#as_json" do
    it "embeds the book and the student" do
      rent = create(:rent)

      expect(rent.as_json).to include(
        "status" => "active",
        "days_late" => 0,
        "book" => rent.book.slice(:id, :code, :title),
        "student" => rent.student.slice(:id, :code, :name, :classroom)
      )
    end
  end
end
