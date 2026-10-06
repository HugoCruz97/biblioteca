Rails.application.routes.draw do
  # Returns 200 if the app boots with no exceptions, otherwise 500. Used by load balancers and uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :books
      resources :students
      resources :rents, only: %i[index show create] do
        patch :return, on: :member, action: :return_book
      end
    end
  end
end
