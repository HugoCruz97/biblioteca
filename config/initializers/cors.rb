# Allow the front-end app to call the API from another origin.
# CORS_ORIGINS is a comma-separated list, e.g. "https://library.vercel.app,http://localhost:5173".
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGINS", "http://localhost:5173").split(",").map(&:strip))

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head]
  end
end
