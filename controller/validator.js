const Joi = require("joi");

module.exports = {
  addDept: (req, res, next) => {
    const schema = Joi.object({
      dept_name: Joi.string().required(),
      dept_code: Joi.string().required(),
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  addYear: (req, res, next) => {
    const schema = Joi.object({
      start_year: Joi.number().integer().min(2000).max(3000).required(),
      end_year: Joi.number().integer().min(2000).max(3000).required(),
    }).options({ allowUnknown: false });

    if (req.body.end_year - req.body.start_year != 1)
      return res.status(200).json({
        status: 400,
        message: "Years intervals exceeds 1 year!",
        data: {},
      });
    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  addSub: (req, res, next) => {
    const schema = Joi.object({
      sub_code: Joi.string().required(),
      sub_name: Joi.string().required(),
      dept_id: Joi.string().required(),
      total_hrs: Joi.number().integer().min(1).max(250).required(),
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  addClass: (req, res, next) => {
    const schema = Joi.object({
      class_code: Joi.string().required(),
      class_name: Joi.string().required(),
      dept_id: Joi.string().required(),
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  addTeachers: (req, res, next) => {
    const schema = Joi.object({
      teacher_code: Joi.string().required(),
      teacher_name: Joi.string().required(),
      class_id: Joi.string().required(),
      dept_id: Joi.string().required(),
      subject_id: Joi.string().required(),
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  addCalendar: (req, res, next) => {
    const schema = Joi.object({
      dept_id: Joi.string().required(),
      start_date: Joi.string().required(),
      end_date: Joi.string().required(),
      is_all_sunday_leave: Joi.boolean().required(),
      total_periods: Joi.number().integer().min(1).max(10).required(),
      period_time: Joi.number().integer().min(1).max(100).required(),
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  checkCalendarId: (req, res, next) => {
    const schema = Joi.object({
      calendar_id: Joi.string().required(),
    }).options({ allowUnknown: true });

    const { error } = schema.validate(req.query);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
  addHoliday: (req, res, next) => {
    const schema = Joi.object({
      leave_date: Joi.string().required(),
      reason: Joi.string().required(),
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  },
};
