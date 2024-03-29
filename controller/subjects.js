const Subjects = require("../models/subjects");
const Teachers = require("../models/teachers");

const handlers = {
  addSubject: async (req, res) => {
    try {
      const newData = req.body;
      const dataExists = await Subjects.findOne(
        {
          $or: [
            {
              year_id: req.headers["year_id"],
              dept_id: newData.dept_id,
              sub_name: newData.sub_name,
              status: 1,
            },
            {
              year_id: req.headers["year_id"],
              dept_id: newData.dept_id,
              sub_code: newData.sub_code,
              status: 1,
            },
          ],
        },
        { sub_name: 1, _id: 1 }
      ).lean();

      if (!!dataExists)
        return res.status(200).json({
          status: 400,
          message: "Subject already exists in this department!",
          data: {},
        });

      const data = await new Subjects({
        ...newData,
        year_id: req.headers["year_id"],
        status: 1,
      }).save();
      return res.status(200).json({
        status: 200,
        message: "Subject added successfully",
        data: { subjects: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  updateSub: async (req, res) => {
    try {
      let { subject_id } = req.query;

      let data = await Subjects.updateOne({ _id: subject_id }, { ...req.body });
      if (!(data.acknowledged && data.modifiedCount == 1))
        return res.status(200).json({
          status: 400,
          message: "Database error!",
          data: {},
        });
      return res.status(200).json({
        status: 200,
        message: "Subject updated successfully",
        data: {},
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  deleteSub: async (req, res) => {
    try {
      let { subject_id } = req.query;
      if (!subject_id)
        return res
          .status(400)
          .json({ status: 500, message: "subject_id required", data: {} });

      let subjectData = await Subjects.updateOne(
        { _id: subject_id },
        { status: 0 }
      );

      if (!(subjectData.acknowledged && subjectData.modifiedCount == 1))
        return res.status(200).json({
          status: 400,
          message: "Database error!",
          data: {},
        });

      // let Data = await Teachers.find({ subject_id: subject_id });
      // console.log(Data);
      let teacherData = await Teachers.updateMany(
        { subject_id: subject_id },
        { status: 0 }
      );

      if (!teacherData.acknowledged)
        return res.status(200).json({
          status: 400,
          message: "Database error!",
          data: {},
        });
      return res.status(200).json({
        status: 200,
        message: "Subject deleted successfully",
        data: {},
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },

  listSubjects: async (req, res) => {
    try {
      let { dept_id, page, chunk, search } = req.query;
      let filterQuery = {
        year_id: req.headers["year_id"],
      };
      if (dept_id && dept_id != "all") filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1, 2] };
      if (!page || page < 1) page = 1;
      if (!chunk || chunk < 5) chunk = 5;

      let data = await Subjects.aggregate([
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
            sub_name: 1,
            sub_code: 1,
            department: {
              $ifNull: [{ $first: "$dept.dept_name" }, "----"],
            },
            total_hrs: 1,
            status: 1,
          },
        },
      ]);
      // let count = await Subjects.aggregate([
      //   { $match: filterQuery },
      //   { $count: "totalCount" },
      // ]);
      let count = await Subjects.find(filterQuery).count();

      return res.status(200).json({
        status: 200,
        message: "Subjects fetched successfully",
        data: {
          subjects: data,
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
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  getSubs: async (req, res) => {
    try {
      let { dept_id, class_id } = req.query;

      if (!dept_id || !class_id)
        return res.status(200).json({
          status: 400,
          message: "Query param missing!",
          data: {},
        });
      let filterQuery = {
        year_id: req.headers["year_id"],
      };
      filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1] };

      let data1 = await Subjects.find(filterQuery, "_id sub_name").sort({
        updatedAt: -1,
      });
      filterQuery.class_id = class_id;
      let data2 = await Teachers.find(filterQuery, "_id subject_id").sort({
        updatedAt: -1,
      });
      let data3 = data1.filter((element1) => {
        return data2.every((element2) => {
          return element1._id != element2.subject_id;
        });
      });
      return res.status(200).json({
        status: 200,
        message: "Subjects fetched successfully",
        data: { subjects: data3 },
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
