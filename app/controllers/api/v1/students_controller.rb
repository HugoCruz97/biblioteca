module Api
  module V1
    class StudentsController < ApplicationController
      before_action :set_student, only: %i[show update destroy]

      # GET /api/v1/students?q=ana
      def index
        students = Student.order(:name)
        students = students.search(params[:q]) if params[:q].present?

        render json: students
      end

      def show
        render json: @student
      end

      def create
        student = Student.create!(student_params)
        render json: student, status: :created
      end

      def update
        @student.update!(student_params)
        render json: @student
      end

      def destroy
        destroy_record(@student)
      end

      private

      def set_student
        @student = Student.find(params[:id])
      end

      def student_params
        params.expect(student: %i[name classroom code])
      end
    end
  end
end
