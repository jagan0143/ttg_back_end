const depts = require("../models/deparments");
const AcademicYears = require("../models/academicYears");

const handlers = {
  getDepts: async (req, res) => {
    try {
      const data = await depts
        .find(
          { year_id: req.headers["year_id"], status: 1 },
          { dept_name: 1, _id: 1 }
        )
        .lean();
      return res.status(200).json({
        status: 200,
        message: "Departments fetched successfully",
        data: { depts: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  addDept: async (req, res) => {
    try {
      const newData = req.body;
      const dataExists = await depts.findOne({
        $or: [
          { year_id: req.headers["year_id"], dept_name: newData.dept_name },
          { year_id: req.headers["year_id"], dept_code: newData.dept_code },
        ],
      });

      if (!!dataExists)
        return res.status(200).json({
          status: 400,
          message: "Department already exists",
          data: {},
        });

      const data = await new depts({
        ...newData,
        year_id: req.headers["year_id"],
        status: 1,
      }).save();

      return res.status(200).json({
        status: 200,
        message: "Department added successfully",
        data: { dept: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  getYears: async (req, res) => {
    try {
      let data = await AcademicYears.find(
        { status: 1 },
        { start_year: 1, end_year: 1, _id: 1 }
      ).lean();

      data.sort(function (a, b) {
        return b.start_year - a.start_year;
      });
      data = data.map((year) => {
        return {
          year: `${year.start_year}-${year.end_year}`,
          _id: year._id,
        };
      });

      return res.status(200).json({
        status: 200,
        message: "Years fetched successfully",
        data: { years: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  addYear: async (req, res) => {
    try {
      const newData = req.body;
      const dataExists = await AcademicYears.findOne({
        $or: [
          { start_year: newData.start_year },
          { end_year: newData.end_year },
        ],
      });

      if (!!dataExists)
        return res.status(200).json({
          status: 400,
          message: "year already exists",
          data: {},
        });

      const data = await new AcademicYears({
        ...newData,
        status: 1,
      }).save();

      return res.status(200).json({
        status: 200,
        message: "Year added successfully",
        data: { year: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
};

module.exports = handlers;
