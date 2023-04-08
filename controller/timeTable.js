const moment = require("moment");
const timeTableEligibilityCheck = require("./timeTableGenerator/eligibilityCheck");
const VerifiedData = require("../models/verifiedData");
const TimeTable = require("../models/timeTable");

const handlers = {
  getTimeTable: async (req, res) => {
    try {
      let { id } = req.query;
      if(!id){
        return res.status(200).json({
          status: 200,
          message: "Id not found in query",
          data: {},
        });
      }
      let timeTableData = await TimeTable.findOne({ vd_id: id }).lean();
      return res.status(200).json({
        status: 200,
        message: "Subjects fetched successfully",
        data: timeTableData? timeTableData: {},
      });
    } catch (error) {
      console.log(error);
      return {
        status: false,
        msg: `Internal server error`,
      };
    }
  },
  listTimeTables: async (req, res) => {
    try {
      console.log("started");
      let response = await timeTableEligibilityCheck(req.year_id);
      if (!response) {
        return res.status(200).json({
          status: 200,
          message: "error",
          data: {},
        });
      }
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
      let { _id } = req.query;
      const verifiedData = await VerifiedData.findOne({
        _id: _id,
        status: 1,
      }).lean();

      let allTimeTables = await TimeTable.find({
        year_id: verifiedData.year_id,
      }); // Need to remove _id timetable from the list
      //console.log(allTimeTables);
      let startDate = verifiedData.calendar.start_date;
      let subjects = verifiedData.subjects;
      let newTimeTable = [];
      //console.log(subjects);

      for (let i = 0; i < verifiedData.calendar.total_wd; i++) {
        //for (let i = 0; i < 1; i++) {
        currentDate = moment(startDate, "YYYY-MM-DD").add(i, "d").format("YYYY-MM-DD");
        let dailyAllocation = {
          academicDate: currentDate,
          allocation: [],
        };

        for (let j = 0; j < verifiedData.calendar.total_periods; j++) {
          //for (let j = 0; j < 1; j++) {
          let found = 0,
            loopLimit = subjects.length,
            currentLoopCount = 0,
            totalLoopCount = 0;
          let subject, lastselected;

          for (let k = 0; k < loopLimit; k++) {
            let subjectIndex = 0,
              highestPeriod = 0;
            subjects.forEach((element, index) => {
              if (
                (!!subject &&
                  element._id != subject._id &&
                  element.totalSubPeriods != 0 &&
                  element.totalSubPeriods > highestPeriod) ||
                (element.totalSubPeriods != 0 &&
                  element.totalSubPeriods > highestPeriod)
              ) {
                highestPeriod = element.totalSubPeriods;
                subjectIndex = index;
              }
            });
            let selectedSubject = subjects[subjectIndex];
            //console.log(`${k}`, subject);

            if (allTimeTables.length == 0) {
              found = 1;
              subjects[subjectIndex].totalSubPeriods =
                subjects[subjectIndex].totalSubPeriods - 1;
              subjects[subjectIndex].selectedCount = subjects[subjectIndex]
                .selectedCount
                ? subjects[subjectIndex].selectedCount + 1
                : 1;
              lastselected = subjects[subjectIndex]._id;
              subject = subjects[subjectIndex];

              k = loopLimit;
            } else {
              let existingData = allTimeTables.find((element) => {
                if (element.vd_id != verifiedData._id) {
                  element.time_table.forEach((tt) => {
                    if (
                      tt.academicDate == currentDate &&
                      tt.allocation[j] &&
                      tt.allocation[j].teacher_id ==
                        subjects[subjectIndex].teacher_id
                    ) {
                      return true;
                    }
                  });
                }
              });
              if (!existingData) {
                found = 1;
                subjects[subjectIndex].totalSubPeriods =
                  subjects[subjectIndex].totalSubPeriods - 1;
                subjects[subjectIndex].selectedCount = subjects[subjectIndex]
                  .selectedCount
                  ? subjects[subjectIndex].selectedCount + 1
                  : 1;
                lastselected = subjects[subjectIndex]._id;
                subject = subjects[subjectIndex];
                console.log(subjects[subjectIndex]);
                k = loopLimit;
              }
            }
            currentLoopCount = currentLoopCount + 1;
          }
          //console.log(subject);
          // delete subject.total_hrs;
          // delete subject.status;
          // delete subject.totalSubPeriods;
          // delete subject.subPriority;
          // delete subject.selectedCount;
          if (found == 1) dailyAllocation.allocation.push({
            sub_code: subject.sub_code,
            sub_name: subject.sub_name,
            teacher_name: subject.teacher_name,
            teacher_code: subject.teacher_code,
            teacher_id: subject.teacher_id
          });
          if (found == 0 && subject._id) {
          }
        }
        newTimeTable.push(dailyAllocation);
        let jobCompleted = subjects.find((element, index) => {
          console.log(index, element)
          return element.totalSubPeriods > 0;
        });
        console.log(jobCompleted);
        if (!jobCompleted) {
          i = verifiedData.calendar.total_wd;
        }
        //console.log("==============>",dailyAllocation)
      }
      console.log("==========================> newTimeTable", newTimeTable);
      await TimeTable.deleteOne({ vd_id: verifiedData._id });

      let TimeTableData = {
        year_id: verifiedData.year_id,
        dept_id: verifiedData.dept_id,
        class_id: verifiedData.class_id,
        vd_id: verifiedData._id,
        class_name: verifiedData.class_name,
        time_table: newTimeTable,
        status: 1,
      };
      await new TimeTable(TimeTableData).save();
      return res.status(200).json({
        status: 200,
        message: "Time Table generated successfully",
        data: {},
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
