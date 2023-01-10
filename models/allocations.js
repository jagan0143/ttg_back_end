const mongoose = require("mongoose");
const { Schema } = mongoose;

const allocations_schema = new Schema(
  {
    class_id: {
      type: String,
      required: true,
    },
    subject_id: {
      type: String,
      required: true,
    },
    teacher_id: {
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

module.exports = mongoose.model("allocation", allocations_schema);
