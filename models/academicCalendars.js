const mongoose = require("mongoose");
const { Schema } = mongoose;

const calendar_schema = new Schema(
  {
    year_id: {
      type: String,
      required: true,
    },
    dept_id: {
      type: String,
      required: true,
    },
    start_date: {
      type: String,
      required: true,
    },
    end_date: {
      type: String,
      required: true,
    },
    is_all_sunday_leave: {
      type: Boolean,
      required: true,
    },
    holidays: [
      {
        leave_date: String,
        reason: String,
      },
    ],
    total_wd: {
      type: Number,
      required: true,
    },
    total_days: {
      type: Number,
      required: true,
    },
    total_periods: {
      type: Number,
      required: true,
    },
    period_time: {
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

module.exports = mongoose.model("calendar", calendar_schema);
