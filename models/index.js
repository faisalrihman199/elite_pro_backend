const user = require("./user");
const employee = require("./employee");
const company = require("./company");
const tempUser = require("./tempUser");
const project = require("./project");
// const projectEmployee = require("./projectEmployee");
const task = require("./task");
// const employeeTask = require("./employeeTask");
const modules = require("./module");
const message = require("./message");
const conversation = require("./conversation");
const team = require("./team");
const teamMembership = require("./teamMembership");
//const projectTeamAssignment = require("./projectTeamAssignment");
const groupChat = require("./groupChat");
const groupChatMembership = require("./groupChatMembership");
const groupChatMessage = require("./groupChatMessage");
const teamTaskAssignment = require("./teamTaskAssigment");
const employeeModuleAssignment = require("./employeeModuleAssignment");
const notification = require("./notification");
const models = { 
  user, 
  employee, 
  company, 
  tempUser, 
  project, 
 
  task, 
  notification,
  modules, 
  message, 
  conversation,
  team,
  teamMembership,
  
  groupChat,
  groupChatMembership,
  groupChatMessage,
  teamTaskAssignment,
  employeeModuleAssignment
};

// Set up associations with cascading delete and update
user.hasMany(employee, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "userId",
});
employee.belongsTo(user, { foreignKey: "userId" });


employee.hasMany(groupChatMessage,{
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "senderId",
})
groupChatMessage.belongsTo(employee,{foreignKey: "senderId",})


groupChat.hasMany(groupChatMessage,{
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "groupChatId",
})
groupChatMessage.belongsTo(groupChat,{foreignKey: "groupChatId",})


user.hasMany(notification, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE",
  foreignKey: "userId",
});
notification.belongsTo(user, { foreignKey: "userId" });


// Association in teamMembership to employee
teamMembership.belongsTo(employee, {
  foreignKey: 'employeeId',
});

// Association in teamMembership to team
teamMembership.belongsTo(team, {
  foreignKey: 'teamId',
});



user.hasMany(company, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "userId",
});
company.belongsTo(user, { foreignKey: "userId" });


// employee.belongsToMany(project, { 
//   through: projectEmployee, 
//   foreignKey: "employeeId", 
//   otherKey: "projectId" 
// });
// project.belongsToMany(employee, { 
//   through: projectEmployee, 
//   foreignKey: "projectId", 
//   otherKey: "employeeId" 
// });

project.hasMany(task, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "projectId",
});
task.belongsTo(project, { foreignKey: "projectId" });

team.belongsToMany(task,{
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "teamId",
  through: teamTaskAssignment,
})

task.belongsToMany(team, { 
  through: teamTaskAssignment, 
  foreignKey: "taskId", 
  otherKey: "teamId" 
});

employee.belongsToMany(modules,{
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  foreignKey: "employeeId",
  through: employeeModuleAssignment,
})

modules.belongsToMany(employee, { 
  through: employeeModuleAssignment, 
  foreignKey: "moduleId", 
  otherKey: "employeeId" 
});

task.hasMany(modules, {
  onDelete: "CASCADE", 
 
  foreignKey: "taskId",
});
modules.belongsTo(task, { foreignKey: "taskId" }); // Fixed `projectId` to `taskId`

// conversation.hasMany(message, {
//   onDelete: "CASCADE", 
//   
//   foreignKey: "conversationId",
// });
// message.belongsTo(conversation, { foreignKey: "conversationId" });

company.hasMany(employee, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "companyId",
}); 
employee.belongsTo(company, { foreignKey: "companyId" });

company.hasMany(project, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  foreignKey: "companyId",
});
project.belongsTo(company, { foreignKey: "companyId" });


company.hasMany(team, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "companyId",
});
team.belongsTo(company, { foreignKey: "companyId" });



employee.belongsToMany(team, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "employeeId",
  through: teamMembership,
});


team.belongsToMany(employee, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "teamId",
  through: teamMembership,
});



employee.hasMany(groupChatMembership, {
  onDelete: "CASCADE", 
  onUpdate: "CASCADE", 
  foreignKey: "employeeId",
});
groupChatMembership.belongsTo(employee, { foreignKey: "employeeId" });

groupChat.hasMany(groupChatMembership, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  foreignKey: "groupChatId",
});

groupChatMembership.belongsTo(groupChat, { foreignKey: "groupChatId" });
module.exports = models;
