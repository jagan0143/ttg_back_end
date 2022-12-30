const baseRouter = require("express").Router();
const validator = require('./controller/validator')
const auth = require('./controller/auth')

// Settings
const settings = require('./controller/settings')
baseRouter.post("/addDept", auth.checkforYear, validator.addDept, settings.addDept);
baseRouter.get("/getDepts", auth.checkforYear, settings.getDepts);
baseRouter.post("/addYear", validator.addYear, settings.addYear);
baseRouter.get("/getYears", settings.getYears);


baseRouter.use((req, res) => res.status(400).json({status: 400, message: "Router not found", data: {}}));

module.exports = baseRouter;