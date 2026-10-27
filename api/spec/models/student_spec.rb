RSpec.describe Student do
  describe "validations" do
    it "requires name, classroom and code" do
      student = described_class.new

      expect(student).not_to be_valid
      expect(student.errors.attribute_names).to contain_exactly(:classroom, :code, :name)
    end

    it "keeps the code unique regardless of case" do
      create(:student, code: "mat-1")

      expect(build(:student, code: "MAT-1")).not_to be_valid
    end
  end

  describe ".search" do
    it "matches name, code or classroom" do
      ana = create(:student, name: "Ana Lima", classroom: "9º A", code: "100")
      bruno = create(:student, name: "Bruno Carvalho", classroom: "8º B", code: "200")

      expect(described_class.search("bruno")).to contain_exactly(bruno)
      expect(described_class.search("9º")).to contain_exactly(ana)
      expect(described_class.search("100")).to contain_exactly(ana)
    end
  end

  describe "#destroy" do
    it "is refused while the student has rents" do
      student = create(:student)
      create(:rent, student: student)

      expect(student.destroy).to be(false)
      expect(student.errors[:base]).to be_present
    end
  end
end
