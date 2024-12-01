const user = require("./user");
const chat = require("./chat");
const dashBoardStats = require("./dashboard");
const team = require("./team");
const employee = require("./employee");
const modules = require("./modules");
const controllers = {user,chat,dashBoardStats,team,employee,modules}

module.exports = controllers;