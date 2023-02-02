const AcademicYears = require("../models/academicYears");

module.exports = {
  checkforYear: async (req, res, next) => {
    try {
      const year_id = req.headers["year_id"];
      if (!year_id)
        return res.status(200).json({
          status: 400,
          message: "Acadamic year auth failed",
          data: {},
        });

      let data = await AcademicYears.findOne(
        { _id: year_id, status: 1 },
        { start_year: 1, end_year: 1, _id: 1 }
      ).lean();

      if (!data)
        return res.status(200).json({
          status: 400,
          message: "Acadamic year auth failed",
          data: {},
        });

      req.year_id = year_id;
      req.start_year = data.start_year;
      req.end_year = data.end_year;
      next();
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
};
