module Api
  module V1
    class RentsController < ApplicationController
      # GET /api/v1/rents?status=active&student_id=1&book_id=2
      def index
        rents = Rent.includes(:book, :student).order(created_at: :desc)
        rents = filter_by_status(rents, params[:status])
        rents = rents.where(student_id: params[:student_id]) if params[:student_id].present?
        rents = rents.where(book_id: params[:book_id]) if params[:book_id].present?

        render json: rents
      end

      def show
        render json: Rent.find(params[:id])
      end

      # POST /api/v1/rents  { "rent": { "book_id", "student_id", "rent_time" } }
      def create
        rent = Rent.lend!(rent_params)
        render json: rent, status: :created
      end

      # PATCH /api/v1/rents/:id/return
      def return_book
        rent = Rent.find(params[:id])
        rent.return!
        render json: rent
      end

      private

      def filter_by_status(rents, status)
        case status
        when "active" then rents.active
        when "late" then rents.late
        when "returned" then rents.returned
        else rents
        end
      end

      def rent_params
        params.expect(rent: %i[book_id student_id rent_time])
      end
    end
  end
end
