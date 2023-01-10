const mongoose = require("mongoose");
const { Schema } = mongoose;

const teachers_schema = new Schema(
  {
    teacher_code: {
      type: String,
      required: true,
    },
    teacher_name: {
      type: String,
      required: true,
    },
    year_id: {
      type: String,
      required: true,
    },
    dept_id: {
      type: String,
      required: true,
    },
    class_id: {
      type: String,
      required: true,
    },
    subject_id: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("teacher", teachers_schema);
