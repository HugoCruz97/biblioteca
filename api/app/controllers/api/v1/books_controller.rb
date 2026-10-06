module Api
  module V1
    class BooksController < ApplicationController
      before_action :set_book, only: %i[show update destroy]

      # GET /api/v1/books?q=machado&available=true
      def index
        books = Book.with_open_rents_count.order(:title)
        books = books.search(params[:q]) if params[:q].present?
        books = books.to_a
        books = books.select { |b| b.available.positive? } if ActiveModel::Type::Boolean.new.cast(params[:available])

        render json: books
      end

      def show
        render json: @book
      end

      def create
        book = Book.create!(book_params)
        render json: book, status: :created
      end

      def update
        @book.update!(book_params)
        render json: @book
      end

      def destroy
        destroy_record(@book)
      end

      private

      def set_book
        @book = Book.find(params[:id])
      end

      def book_params
        params.expect(book: %i[code title author publisher description quantity])
      end
    end
  end
end
