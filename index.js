const dotenv = require("dotenv");
const express = require('express');
const path = require("path");
const cors = require('cors');
const app = express();
const { argv } = require('process');

// Load env
if(loadEnv = dotenv.config({path: argv[2] || ".env.dev"}).error){
    console.log("Invalid env provided exiting the app.", loadEnv);
    process.exit(1);
}
const PORT = parseInt(process.env.APP_PORT || "3000", 10);
const HOSTNAME = process.env.APP_HOSTNAME;

app.use(cors());
// error handler
app.use((err, req, res, next) => {
	if (err) {
		res.status(400).json({status:400, message: "Server error", data:{}})
	} else {
		next();
	}
})
app.use('/public',express.static(path.join(__dirname, '/public')));

app.use("/api", require('./router'));


app.set("port", PORT);
const server = require('http').createServer(app);
server.listen(PORT, HOSTNAME, (req, res) => {
    console.log(`Server running on http://${HOSTNAME}:${PORT}`);
  });
