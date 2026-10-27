# expect { ... }.not_to make_database_queries
RSpec::Matchers.define :make_database_queries do
  supports_block_expectations

  match do |block|
    @queries = []
    callback = ->(*, payload) { @queries << payload[:sql] unless payload[:name] == "SCHEMA" }
    ActiveSupport::Notifications.subscribed(callback, "sql.active_record", &block)
    @queries.any?
  end

  failure_message_when_negated do
    "expected no queries, but got:\n#{@queries.join("\n")}"
  end
end
