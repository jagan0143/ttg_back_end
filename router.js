const baseRouter = require("express").Router();
const validator = require("./controller/validator");
const auth = require("./controller/auth");

// Settings
const settings = require("./controller/settings");
baseRouter.post(
  "/addDept",
  auth.checkforYear,
  validator.addDept,
  settings.addDept
);
baseRouter.get("/deptDropdown", auth.checkforYear, settings.getDepts);
baseRouter.post("/addYear", validator.addYear, settings.addYear);
baseRouter.get("/yearDropdown", settings.getYears);

// Subject management
const subjects = require("./controller/subjects");
baseRouter.post(
  "/addSub",
  auth.checkforYear,
  validator.addSub,
  subjects.addSubject
);
baseRouter.get("/listSubjects", auth.checkforYear, subjects.listSubjects);
baseRouter.get("/subDropdown", auth.checkforYear, subjects.getSubs);


// class management
const classes = require("./controller/classes");
baseRouter.post(
  "/addClass",
  auth.checkforYear,
  validator.addClass,
  classes.addClass
);
baseRouter.get("/listClasses", auth.checkforYear, classes.listClasses);
baseRouter.get("/classDropdown", auth.checkforYear, classes.getClasses);

// Teacher management
const teachers = require("./controller/teachers");
baseRouter.post(
  "/addTeacher",
  auth.checkforYear,
  validator.addTeachers,
  teachers.addTeachers
);
baseRouter.get("/listTeachers", auth.checkforYear, teachers.listTeachers);


baseRouter.use((req, res) =>
  res.status(400).json({ status: 400, message: "Router not found", data: {} })
);

module.exports = baseRouter;
