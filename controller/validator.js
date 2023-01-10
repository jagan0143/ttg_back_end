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
      start_year: Joi.number().required(),
      end_year: Joi.number().required(),
    }).options({ allowUnknown: false });

    if (req.body.end_year - req.body.start_year > 1)
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
      total_hrs: Joi.number().required()
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
      dept_id: Joi.string().required()
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
      subject_id: Joi.string().required()
    }).options({ allowUnknown: false });

    const { error } = schema.validate(req.body);
    if (error)
      return res.status(200).json({
        status: 400,
        message: error.details[0].message.replace(/\"/g, ""),
        data: {},
      });
    else next();
  }
};
