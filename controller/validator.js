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
};
