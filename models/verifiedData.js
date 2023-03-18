const { number, required } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const verifiedData_schema = new Schema(
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
    class_name: {
      type: String,
      required: true,
    },
    calendarStatus: {
        type: Object
    },
    subjectStatus: {
        type: Object
    },
    teacherStatus: {
        type: Object
    },
    calendar: {
        type: Object
    },
    subject: {
      type: Array,
    },
    totalSubjectHours: {
      type: Number,
      required: true,
    },
    totalSubjecPeriods: {
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

module.exports = mongoose.model("verifiedData", verifiedData_schema);
