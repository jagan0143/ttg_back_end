const mongoose = require("mongoose");
const { Schema } = mongoose;

const class_schema = new Schema(
  {
    class_code: {
      type: String,
      required: true,
    },
    class_name: {
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
    // subjects: {
    //   type: Array,
    //   required: true,
    //   default: []
    // },
    status: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("class", class_schema);
