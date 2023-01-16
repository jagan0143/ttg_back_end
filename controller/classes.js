const Classes = require("../models/classes");
const handlers = {
  addClass: async (req, res) => {
    try {
      const newData = req.body;
      const dataExists = await Classes.findOne(
        {
          $or: [
            {
              year_id: req.headers["year_id"],
              dept_id: newData.dept_id,
              class_name: newData.class_name,
              status: 1,
            },
            {
              year_id: req.headers["year_id"],
              dept_id: newData.dept_id,
              class_code: newData.class_code,
              status: 1,
            },
          ],
        },
        { class_name: 1, _id: 1 }
      ).lean();

      if (!!dataExists)
        return res.status(200).json({
          status: 400,
          message: "Class already exists in this department!",
          data: {},
        });

      const data = await new Classes({
        ...newData,
        year_id: req.headers["year_id"],
        status: 1,
      }).save();

      return res.status(200).json({
        status: 200,
        message: "class added successfully",
        data: { class_data: data },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  listClasses: async (req, res) => {
    try {
      let { dept_id, page, chunk, search } = req.query;
      let filterQuery = {
        year_id: req.headers["year_id"],
      };
      if (dept_id && dept_id != "all") filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1, 2] };
      if (page < 1) page = 1;
      if (chunk < 5) chunk = 5;

      let data = await Classes.aggregate([
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
            class_code: 1,
            department: {
              $ifNull: [{ $first: "$dept.dept_name" }, "----"],
            },
            status: 1,
          },
        },
      ]);
      // let count = await Classes.aggregate([
      //   { $match: filterQuery },
      //   { $count: "totalCount" },
      // ]);
      let count = await Classes.find(filterQuery).count();

      return res.status(200).json({
        status: 200,
        message: "classes fetched successfully",
        data: {
          classes: data,
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
  getClasses: async (req, res) => {
    try {
      let { dept_id } = req.query;

      if (!dept_id)
        return res.status(200).json({
          status: 400,
          message: "Department Id is required in query!",
          data: {},
        });
      let filterQuery = {
        year_id: req.headers["year_id"],
      };
      filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1] };

      let data = await Classes.find(filterQuery, "_id class_name").sort({
        updatedAt: -1,
      });

      return res.status(200).json({
        status: 200,
        message: "Classes fetched successfully",
        data: { Classes: data },
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
