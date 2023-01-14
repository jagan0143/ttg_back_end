const Teachers = require("../models/teachers");
const handlers = {
  addTeachers: async (req, res) => {
    try {
      const newData = req.body;
      const dataExists = await Teachers.findOne(
        {
          $or: [
            {
              year_id: req.headers["year_id"],
              dept_id: newData.dept_id,
              class_id: newData.class_id,
              subject_id: newData.subject_id,
              teacher_name: newData.teacher_name,
              status: 1,
            },
            {
              year_id: req.headers["year_id"],
              dept_id: newData.dept_id,
              class_id: newData.class_id,
              subject_id: newData.subject_id,
              teacher_code: newData.teacher_code,
              status: 1,
            },
          ],
        },
        { teacher_name: 1, _id: 1 }
      ).lean();

      if (!!dataExists)
        return res.status(200).json({
          status: 200,
          message: "Teacher already exists",
          data: {},
        });

      const data = await new Teachers({
        ...newData,
        year_id: req.headers["year_id"],
        status: 1,
      }).save();
      return res.status(200).json({
        status: 200,
        message: "Teachers added successfully",
        data: { teachers: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(200)
        .json({ status: 400, message: "Internal server error", data: {} });
    }
  },
  listTeachers: async (req, res) => {
    try {
      let { dept_id, page, chunk, search } = req.query;
      let filterQuery = {
        year_id: req.headers["year_id"],
      };
      if (dept_id) filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1] };
      if (page < 1) page = 1;
      if (chunk < 5) chunk = 5;

      let data = await Teachers.aggregate([
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
        {
          $lookup: {
            from: "classes",
            let: { searchId: { $toObjectId: "$class_id" } },
            //localField: "$$searchId",
            //foreignField: "_id",
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$searchId"] } } },
              { $project: { _id: 1, class_name: 1 } },
              { $limit: 1 },
            ],
            as: "class_name",
          },
        },
        {
          $lookup: {
            from: "subjects",
            let: { searchId: { $toObjectId: "$subject_id" } },
            //localField: "$$searchId",
            //foreignField: "_id",
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$searchId"] } } },
              { $project: { _id: 1, sub_name: 1 } },
              { $limit: 1 },
            ],
            as: "subject",
          },
        },
        { $skip: (page - 1) * chunk },
        { $limit: chunk * 1 },
        { $sort: { updatedAt: -1 } },
        {
          $project: {
            _id: 1,
            teacher_name: 1,
            teacher_code: 1,
            department: {
              $ifNull: [{ $first: "$dept.dept_name" }, "----"],
            },
            class_name: {
              $ifNull: [{ $first: "$class_name.class_name" }, "----"],
            },
            subject_name: {
              $ifNull: [{ $first: "$subject.sub_name" }, "----"],
            },
            status: 1,
          },
        },
      ]);

      let count = await Teachers.aggregate([
        { $match: filterQuery },
        { $count: "totalCount" },
      ]);

      return res.status(200).json({
        status: 200,
        message: "Teachers fetched successfully",
        data: {
          teachers: data,
          pageMeta: {
            page: page * 1,
            chunk: chunk * 1,
            totalCount: count[0].totalCount,
            totalPage: Math.ceil(count[0].totalCount / chunk),
          },
        },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(200)
        .json({ status: 400, message: "Internal server error", data: {} });
    }
  },
};

module.exports = handlers;
