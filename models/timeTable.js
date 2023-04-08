const { number, required } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const timeTable_schema = new Schema(
  {
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
    vd_id: {
      type: String,
      required: true,
    },
    class_name: {
      type: String,
      required: true,
    },
    time_table: {
        type: Array,
        required: true
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

module.exports = mongoose.model("timeTable", timeTable_schema);
