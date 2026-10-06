class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable
  rescue_from ActionController::ParameterMissing, with: :bad_request

  private

  def render_errors(record, status: :unprocessable_content)
    render json: { error: record.errors.full_messages.to_sentence, details: record.errors.to_hash },
           status: status
  end

  # Used by destroy actions: restrict_with_error leaves the reason in record.errors
  def destroy_record(record)
    if record.destroy
      head :no_content
    else
      render_errors(record, status: :conflict)
    end
  end

  def not_found(exception)
    model = exception.model&.constantize&.model_name&.human || I18n.t("errors.record")
    render json: { error: I18n.t("errors.not_found", model: model) }, status: :not_found
  end

  def unprocessable(exception)
    render_errors(exception.record)
  end

  def bad_request(exception)
    render json: { error: exception.message }, status: :bad_request
  end
end
