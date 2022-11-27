const baseRouter = require("express").Router();

baseRouter.use("/test", (req, res) => {res.status(200).json({status:200, message: "soundar p***a", data:{}})});
baseRouter.use((req, res) => res.status(400).json({status: 400, message: "Router not found", data: {}}));

module.exports = baseRouter;