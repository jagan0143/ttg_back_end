const timeTableEligibilityCheck = require("./timeTableGenerator/eligibilityCheck");
const VerifiedData = require("../models/verifiedData");

const handlers = {
  listTimeTables: async (req, res) => {
    try {
      await timeTableEligibilityCheck(req.year_id);

      let { dept_id, page, chunk, search } = req.query;
      let filterQuery = {
        year_id: req.year_id,
      };
      if (dept_id && dept_id != "all") filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1, 2] };
      if (!page || page < 1) page = 1;
      if (!chunk || chunk < 5) chunk = 5;

      const verifiedData = await VerifiedData.aggregate([
        { $match: filterQuery },
        {
          $lookup: {
            from: "departments",
            let: { searchId: { $toObjectId: "$dept_id" } },
            //localField: "$$searchId",
            //foreignField: "_id",
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$searchId"] } } },
              { $project: { _id: 1, dept_name: 1 } },
              { $limit: 1 },
            ],
            as: "dept",
          },
        },
        { $skip: (page - 1) * chunk },
        { $limit: chunk * 1 },
        { $sort: { updatedAt: -1 } },
        {
          $project: {
            _id: 1,
            class_name: 1,
            department: {
              $ifNull: [{ $first: "$dept.dept_name" }, "----"],
            },
            calendarStatus: 1,
            subjectStatus: 1,
            teacherStatus: 1,
            totalHours: {
              $ifNull: ["$calendar.totalHours", 0],
            },
            //calendar: 1,
            //subject: 1,
            totalSubjectHours: 1,
            //totalSubjecPeriods: 1,
            status: 1,
          },
        },
      ]);
      let count = await VerifiedData.find(filterQuery).count();
      return res.status(200).json({
        status: 200,
        message: "Time Tables fetched successfully",
        data: {
          timeTables: verifiedData,
          pageMeta: {
            page: page * 1,
            chunk: chunk * 1,
            totalCount: count,
            totalPage: Math.ceil(count / chunk),
          },
        },
      });
    } catch (error) {
      console.log(error);
      return {
        status: false,
        msg: `Internal server error while validating dates`,
      };
    }
  },
  generateTimetable: async (req, res) => {
    try {
      let { class_id } = req.query;
      const verifiedData = await VerifiedData.find({class_id: class_id, status:1}).lean();

      return res.status(200).json({
        status: 200,
        message: "Subjects fetched successfully",
        data: verifiedData,
      });
    } catch (error) {
      console.log(error);
      return {
        status: false,
        msg: `Internal server error while validating dates`,
      };
    }
  },
};

module.exports = handlers;
