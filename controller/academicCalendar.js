const Calendar = require("../models/academicCalendars");
const AcademicYears = require("../models/academicYears");
const moment = require("moment");
const Teachers = require("../models/teachers");

const helpers = {
  validateCalendarDates: async (
    startDate,
    endDate,
    startYear,
    endYear,
    is_all_sunday_leave
  ) => {
    try {
      let start_date = moment(startDate, "YYYY-MM-DD");
      let end_date = moment(endDate, "YYYY-MM-DD");

      if (!start_date.isValid()) {
        return {
          status: false,
          msg: "Invalid start date!",
        };
      }

      if (!end_date.isValid()) {
        return {
          status: false,
          msg: "Invalid end date!",
        };
      }

      if (start_date.format("YYYY") != startYear) {
        return {
          status: false,
          msg: `Start date year sholud be in ${startYear}`,
        };
      }

      if (end_date.format("YYYY") != endYear) {
        return {
          status: false,
          msg: `End date year sholud be in ${endYear}`,
        };
      }
      let diff = end_date.diff(start_date, "days") + 1;

      if (diff - 1 < 1) {
        return {
          status: false,
          msg: `Start date & End date different should be more than 1`,
        };
      }

      let sundays = [];
      if (is_all_sunday_leave)
        for (let i = 0; i <= diff; i++) {
          let day = moment(start_date).add(i, "d").format("dddd");
          if (day == "Sunday") {
            sundays.push({
              leave_date: moment(start_date).add(i, "d").format("YYYY-MM-DD"),
              reason: day,
            });
            i = i + 6;
          }
        }
      //console.log(diff, diff - sundays.length, sundays.length);
      return {
        status: true,
        data: {
          start_date: start_date.format("YYYY-MM-DD"),
          end_date: end_date.format("YYYY-MM-DD"),
          total_wd: diff - sundays.length,
          total_days: diff,
          is_all_sunday_leave: is_all_sunday_leave,
          holidays: sundays,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        status: false,
        msg: `Internal server error while validating dates`,
      };
    }
  },
};
const handlers = {
  addCalendar: async (req, res) => {
    try {
      const newData = req.body;
      const dataExists = await Calendar.findOne(
        {
          $or: [
            {
              year_id: req.year_id,
              dept_id: newData.dept_id,
              status: 1,
            },
            {
              year_id: req.year_id,
              dept_id: newData.dept_id,
              status: 1,
            },
          ],
        },
        { _id: 1 }
      ).lean();

      if (!!dataExists)
        return res.status(200).json({
          status: 400,
          message: "Calendar already exists for this department!",
          data: {},
        });

      const dateData = await helpers.validateCalendarDates(
        newData.start_date,
        newData.end_date,
        req.start_year,
        req.end_year,
        newData.is_all_sunday_leave
      );

      if (!dateData.status)
        return res.status(200).json({
          status: 400,
          message: dateData.msg,
          data: {},
        });

      const data = await new Calendar({
        ...dateData.data,
        dept_id: newData.dept_id,
        year_id: req.headers["year_id"],
        total_periods: newData.total_periods,
        period_time: newData.period_time,
        //period_time: (newData.period_time/60).toFixed(2) * 1,
        status: 1,
      }).save();

      const resData = {
        _id: data._id,
        dept_id: data.dept_id,
        start_date: data.start_date,
        end_date: data.end_date,
        is_all_sunday_leave: data.is_all_sunday_leave,
        total_periods: data.total_periods,
        period_time: data.period_time,
      };
      return res.status(200).json({
        status: 200,
        message: "Academic Calendar added successfully",
        data: { academicCalendar: resData },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  listCalendars: async (req, res) => {
    try {
      let { page, chunk, search } = req.query;
      let filterQuery = {
        year_id: req.year_id,
      };
      //if (dept_id && dept_id != "all") filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1, 2] };
      if (!page || page < 1) page = 1;
      if (!chunk || chunk < 5) chunk = 5;

      let data = await Calendar.aggregate([
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
            start_date: 1,
            end_date: 1,
            department: {
              $ifNull: [{ $first: "$dept.dept_name" }, "----"],
            },
            total_wd: 1,
            total_holidays: { $subtract: ["$total_days", "$total_wd"] },
            total_days: 1,
            total_periods: 1,
            status: 1,
          },
        },
      ]);
      // let count = await Subjects.aggregate([
      //   { $match: filterQuery },
      //   { $count: "totalCount" },
      // ]);
      let count = await Calendar.find(filterQuery).count();

      return res.status(200).json({
        status: 200,
        message: "Calendars fetched successfully",
        data: {
          calendars: data,
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
  listHolidays: async (req, res) => {
    try {
      let { calendar_id, page, chunk, search } = req.query;
      let filterQuery = {
        _id: calendar_id,
      };
      //if (dept_id && dept_id != "all") filterQuery.dept_id = dept_id;
      filterQuery.status = { $in: [1, 2] };
      if (!page || page < 1) page = 1;
      if (!chunk || chunk < 5) chunk = 5;

      let data = await Calendar.findOne(filterQuery, {
        _id: 1,
        total_wd: 1,
        total_holidays: { $subtract: ["$total_days", "$total_wd"] },
        total_days: 1,
        holidays: 1,
        status: 1,
      }).lean();

      if (!data) {
        return res.status(200).json({
          status: 400,
          message: "Calendar not found!",
          data: {},
        });
      }
      let { holidays, ...daysData } = data;
      holidays = holidays.sort((a, b) => {
        return moment(a.leave_date).diff(b.leave_date);
      });
      let holidaysList = holidays.slice((page - 1) * chunk, chunk * page);

      return res.status(200).json({
        status: 200,
        message: "Holidays fetched successfully",
        data: {
          daysData: daysData,
          holidays: holidaysList,
          pageMeta: {
            page: page * 1,
            chunk: chunk * 1,
            totalCount: holidays.length,
            totalPage: Math.ceil(holidays.length / chunk),
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
  addHolidays: async (req, res) => {
    try {
      const { calendar_id } = req.query;
      let calendarData = await Calendar.findById(calendar_id).lean();
      // let start_date = moment(calendarData.start_date, "YYYY-MM-DD");
      // let end_date = moment(calendarData.end_date, "YYYY-MM-DD");
      let leave_date = moment(req.body.leave_date, "YYYY-MM-DD");

      if (
        !leave_date.isValid() ||
        leave_date < moment(calendarData.start_date, "YYYY-MM-DD") ||
        leave_date > moment(calendarData.end_date, "YYYY-MM-DD")
      )
        return res.status(200).json({
          status: 400,
          message: `Date should be in between ${moment(
            calendarData.start_date
          ).format("YYYY-MM-DD")} and ${moment(calendarData.end_date).format(
            "YYYY-MM-DD"
          )}`,
          data: {},
        });

      if (
        !!(await Calendar.findOne({
          _id: calendar_id,
          holidays: {
            $elemMatch: { leave_date: leave_date.format("YYYY-MM-DD") },
          },
        }))
      ) {
        return res.status(200).json({
          status: 400,
          message: "Leave already added!",
          data: {},
        });
      }
      let data = await Calendar.updateOne(
        { _id: calendar_id },
        {
          $inc: { total_wd: -1 },
          $push: {
            holidays: {
              leave_date: leave_date.format("YYYY-MM-DD"),
              reason: req.body.reason,
            },
          },
        }
      );
      if (!(data.acknowledged && data.modifiedCount == 1))
        return res.status(200).json({
          status: 400,
          message: "Database error!",
          data: {},
        });

      return res.status(200).json({
        status: 200,
        message: "Holiday updated successfully",
        data: {},
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  deleteHoliday: async (req, res) => {
    try {
      const { calendar_id, leave_id } = req.query;
      if (!leave_id)
        return res.status(200).json({
          status: 400,
          message: "leave_id required!",
          data: {},
        });

      if (
        !(await Calendar.findOne({
          _id: calendar_id,
          holidays: {
            $elemMatch: { _id: leave_id },
          },
        }))
      ) {
        return res.status(200).json({
          status: 400,
          message: "Leave not found!",
          data: {},
        });
      }

      let data = await Calendar.updateOne(
        { _id: calendar_id },
        {
          $inc: { total_wd: 1 },
          $pull: {
            holidays: {
              _id: leave_id,
            },
          },
        }
      );
      if (!(data.acknowledged && data.modifiedCount == 1))
        return res.status(200).json({
          status: 400,
          message: "Database error!",
          data: {},
        });

      return res.status(200).json({
        status: 200,
        message: "Holiday updated successfully",
        data: {},
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal server error", data: {} });
    }
  },
  viewCalendar: async (req, res) => {
    try {
      const { calendar_id } = req.query;
      if (!calendar_id)
        return res.status(200).json({
          status: 400,
          message: "calendar_id required!",
          data: {},
        });

      let calendarData = await Calendar.findOne(
        { _id: calendar_id, status: 1 },
        {
          _id: 1,
          dept_id: 1,
          start_date: 1,
          end_date: 1,
          is_all_sunday_leave: 1,
          total_periods: 1,
          period_time: 1,
        }
      ).lean();
      if (!calendarData) {
        return res.status(200).json({
          status: 400,
          message: "Calendar not found!",
          data: {},
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Calendar fetched successfully",
        data: calendarData,
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
