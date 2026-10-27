RSpec.describe "Factories" do
  FactoryBot.factories.each do |factory|
    it "builds a valid #{factory.name}" do
      expect(create(factory.name)).to be_persisted
    end
  end
end
