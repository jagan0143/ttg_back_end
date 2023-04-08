const Classes = require("../../models/classes");
const Calendar = require("../../models/academicCalendars");
const Subjects = require("../../models/subjects");
const Teachers = require("../../models/teachers");
const VerifiedData = require("../../models/verifiedData");

module.exports = updateEligibility = async (year_id) => {
  try {
    let classes = await Classes.aggregate([
      { $match: { year_id: year_id, status: 1 } },
      {
        $lookup: {
          from: "calendars",
          let: {
            searchId1: "$dept_id",
            searchId2: "$year_id",
          },
          //localField: "$$searchId",
          //foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$dept_id", "$$searchId1"] },
                    { $eq: ["$year_id", "$$searchId2"] },
                    { $eq: ["$status", 1] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                start_date: 1,
                end_date: 1,
                is_all_sunday_leave: 1,
                total_wd: 1,
                total_days: 1,
                period_time: 1,
                total_periods: 1,
                totalAcademicPeriods: {
                  $multiply: ["$total_periods", "$total_wd"],
                },
                totalHours: {
                  $round: [
                    {
                      $divide: [
                        {
                          $multiply: [
                            "$total_periods",
                            "$period_time",
                            "$total_wd",
                          ],
                        },
                        60,
                      ],
                    },
                    0,
                  ],
                },
                extraMinutes: {
                  $mod: [
                    {
                      $multiply: [
                        "$total_periods",
                        "$period_time",
                        "$total_wd",
                      ],
                    },
                    60,
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "calendar",
        },
      },
      {
        $lookup: {
          from: "subjects",
          let: {
            searchId1: "$dept_id",
            searchId2: "$year_id",
          },
          //localField: "$$searchId",
          //foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$dept_id", "$$searchId1"] },
                    { $eq: ["$year_id", "$$searchId2"] },
                    { $eq: ["$status", 1] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                sub_name: 1,
                sub_code: 1,
                total_hrs: 1,
                status: 1,
              },
            },
          ],
          as: "subjects",
        },
      },
      {
        $project: {
          _id: 1,
          dept_id: 1,
          year_id: 1,
          class_name: 1,
          class_code: 1,
          status: 1,
          subjects: {
            $ifNull: ["$subjects", []],
          },
          calendar: {
            $ifNull: [{ $first: "$calendar" }, false],
          },
        },
      },
    ]);
    let dataContainer = classes;
    //Check whether all the classes have active department

    let eligibilityData = [];
    for (let i = 0; i < classes.length; i++) {
      element = classes[i];
      let eligibilityCheck = {
        status: 2,
        class_id: element._id,
        class_name: element.class_name,
        dept_id: element.dept_id,
        year_id: element.year_id,
        calendarStatus: {
          status: 0,
          message: "Calendar Not Found",
        },
        subjectStatus: {
          status: 0,
          message: "Subject Not Found",
        },
        teacherStatus: {
          status: 0,
          message: "Teacher Not Found",
        },
        calendar: element.calendar,
        subjects: [],
        totalSubjectHours: 0,
        totalSubjecPeriods: 0,
      };

      if (!eligibilityCheck.calendar)
        eligibilityCheck.subjectStatus.message = "Time Validation pending";

      let subjects = element.subjects;
      if (subjects.length > 0) {
        let calTotalSubjectHrs = 0;
        let teacherFilter = [];
        await subjects.forEach((subject) => {
          teacherFilter.push({
            class_id: element._id.toString(),
            subject_id: subject._id.toString(),
            status: 1,
          });
          calTotalSubjectHrs = calTotalSubjectHrs + subject.total_hrs;
        });
        eligibilityCheck.totalSubjectHours = calTotalSubjectHrs;
        if (
          eligibilityCheck.calendar &&
          eligibilityCheck.calendar.totalHours < calTotalSubjectHrs
        ) {
          eligibilityCheck.subjectStatus.message = "Less Academic Time";
          eligibilityCheck.subjectStatus.status = 0;
        }

        let teachers = await Teachers.aggregate([
          { $match: { $or: teacherFilter } },
          {
            $project: {
              _id: 1,
              subject_id: 1,
              class_id: 1,
              status: 1,
              teacher_name: 1,
              teacher_code: 1,
            },
          },
        ]);

        let teacherExists = 1;
        let teacherMessage = "";
        let subjectData = [];
        for (let j = 0; j < subjects.length; j++) {
          let subject = subjects[j];
          let teacher = await teachers.find((tech) => {
            if (subject._id.toString() == tech.subject_id) {
              return true;
            }
          });
          let totalSubPeriods = 0,
            subPriority = 0;
          if (element.calendar) {
            totalSubPeriods = Math.floor(
              (subject.total_hrs * 60) / element.calendar.period_time
            );
            if (totalSubPeriods > 0)
              subPriority = Math.ceil(
                (element.calendar.total_wd * element.calendar.total_periods) /
                  totalSubPeriods
              );
          }
          if (teacher) {
            subjectData.push({
              ...subject,
              totalSubPeriods: totalSubPeriods,
              subPriority: subPriority,
              teacher_name: teacher.teacher_name,
              teacher_code: teacher.teacher_code,
              teacher_id: teacher._id,
            });
          } else {
            teacherExists = 0;
            teacherMessage = `${subject.sub_name} subject has no teacher`;
            subjectData.push({
              ...subject,
              totalSubPeriods: totalSubPeriods,
              subPriority: subPriority,
              teacher_name: null,
              teacher_code: null,
              teacher_id: null,
            });
          }
        }
        //console.log(subjects);
        eligibilityCheck.subjects = subjectData;

        if (teacherExists == 0)
          eligibilityCheck.teacherStatus.message = teacherMessage;

        if (element.calendar) {
          eligibilityCheck.calendarStatus.message = "Verified";
          eligibilityCheck.calendarStatus.status = 1;
        }
        if (
          eligibilityCheck.calendar &&
          eligibilityCheck.calendar.totalHours > calTotalSubjectHrs
        ) {
          eligibilityCheck.subjectStatus.message = "Verified";
          eligibilityCheck.subjectStatus.status = 1;
        }
        if (teacherExists == 1) {
          eligibilityCheck.teacherStatus.message = "Verified";
          eligibilityCheck.teacherStatus.status = 1;
        }
        if (
          eligibilityCheck.calendarStatus.status &&
          eligibilityCheck.subjectStatus.status &&
          eligibilityCheck.teacherStatus.status
        ) {
          eligibilityCheck.status = 1;
        }
      }

      eligibilityData.push(eligibilityCheck);
    }

    //console.log(eligibilityData[0].subjects);

    for (let i = 0; i < eligibilityData.length; i++) {
      await VerifiedData.findOneAndUpdate(
        { class_id: eligibilityData[i].class_id },
        eligibilityData[i],
        { upsert: true }
      );
    }

    return true;
    // Fetch Calendar details of the clasess
    // let calendarFilter = classes.map((item) => {
    //   return { dept_id: item.dept_id, year_id: year_id, status: 1 };
    // });

    // const calendars = await Calendar.aggregate([
    //   { $match: { $or: calendarFilter } },

    //   {
    //     $project: {
    //       _id: 1,
    //       year_id: 1,
    //       dept_id: 1,
    //       start_date: 1,
    //       end_date: 1,
    //       is_all_sunday_leave: 1,
    //       total_wd: 1,
    //       total_days: 1,
    //       total_periods: 1,
    //       period_time: 1,
    //       status: 1,
    //       totalHours: {
    //         $round: [
    //           {
    //             $divide: [
    //               {
    //                 $multiply: ["$total_periods", "$period_time", "$total_wd"],
    //               },
    //               60,
    //             ],
    //           },
    //           0,
    //         ],
    //       },
    //       extraMinutes: {
    //         $mod: [
    //           {
    //             $multiply: ["$total_periods", "$period_time", "$total_wd"],
    //           },
    //           60,
    //         ],
    //       },
    //     },
    //   },
    // ]);
    //console.log(calendars);

    // let subjectFilter = classes.map((item) => {
    //   return { dept_id: item.dept_id, year_id: year_id, status: 1 };
    // });
    // const subjects = await Subjects.aggregate([
    //   { $match: { $or: subjectFilter } },
    //   {
    //     $project: {
    //       _id: 1,
    //       sub_name: 1,
    //       sub_code: 1,
    //       year_id: 1,
    //       dept_id: 1,
    //       total_hrs: 1,
    //       status: 1,
    //     },
    //   },
    // ]);

    //console.log(subjects);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
