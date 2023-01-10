const mongoose = require("mongoose");
const { Schema } = mongoose;

const subject_schema = new Schema(
  {
    sub_code: {
      type: String,
      required: true,
    },
    sub_name: {
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
    total_hrs: {
      type: Number,
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

module.exports = mongoose.model("subject", subject_schema);
