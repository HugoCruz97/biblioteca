FactoryBot.define do
  factory :book do
    sequence(:code) { |n| "B-#{n}" }
    title { "Dom Casmurro" }
    author { "Machado de Assis" }
    publisher { "Garnier" }
    quantity { 1 }
  end

  factory :student do
    sequence(:code) { |n| "S-#{n}" }
    name { "Ana Lima" }
    classroom { "9º A" }
  end

  factory :rent do
    book
    student
    rent_time { 7 }

    trait :late do
      after(:create) { |rent| rent.update_columns(due_on: 3.days.ago.to_date) }
    end

    trait :returned do
      after(:create) { |rent| rent.return! }
    end
  end
end
