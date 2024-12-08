const model = require("../models");
const { Op } = require("sequelize");


exports.createTeam = async (req, res) => {
  const userId = req.user.id
  const {teamId} = req.query
  
  let {name, description, members} = req.body // Assuming 'members' is an array of employeeIds
  console.log("members", members)
  console.log("members", typeof(members))
  members = Array.from(members)
  console.log("members", members)
  
  if(req.user.role !== 'admin') {
      return res.status(401).json({message: 'You are not authorized to create a team'})
  }
 
  try {
      const company = await model.company.findOne({where: {UserId: userId}})
      // Check if the team already exists (for creation case)
      const existingTeam = await model.team.findOne({where: {name, companyId: company.id}})
      
      console.log("company", company)
      
      // Update the team
      if(teamId) {
          const team = await model.team.findOne({where: {id: teamId}})
          if(!team) {
              return res.status(404).json({success: false, message: 'Team not found'})
          }

          // Update team details
          team.name = name
          team.description = description
          await team.save()

          // Add new employee memberships if provided
          if (members && members.length > 0) {
              const membershipData = []

              for (const employeeId of members) {
                  const existingMembership = await model.teamMembership.findOne({ where: { teamId: team.id, employeeId } });
                  if (existingMembership) {
                      // Skip if membership already exists
                      console.log(`Employee with ID ${employeeId} is already a member of this team.`)
                      continue; // Skip to the next employee
                  }

                  // Add new membership data to be inserted
                  membershipData.push({
                      teamId: team.id,
                      employeeId,
                      roleInTeam: 'member' // Set default role or allow role to be passed
                  });
              }

              // Only create memberships for employees that don't already exist in the team
              if (membershipData.length > 0) {
                  await model.teamMembership.bulkCreate(membershipData);
              }
          }

          return res.status(200).json({success: true, message: 'Team updated successfully', data: team})
      }
      
      // For team creation
      if(existingTeam) {
          return res.status(400).json({success: false, message: 'Team with this name already exists'})
      }

      const team = await model.team.create({name, description, companyId: company.id})

      // Add employees to the team if provided in the members array
      if (members && members.length > 0) {
          const membershipData = []

          for (const employeeId of members) {
              const existingMembership = await model.teamMembership.findOne({ where: { teamId: team.id, employeeId } });
              if (existingMembership) {
                  // Skip if membership already exists
                  console.log(`Employee with ID ${employeeId} is already a member of this team.`)
                  continue; // Skip to the next employee
              }

              // Add new membership data to be inserted
              membershipData.push({
                  teamId: team.id,
                  employeeId,
                  roleInTeam: 'member' // Set default role or allow role to be passed
              });
          }

          // Only create memberships for employees that don't already exist in the team
          if (membershipData.length > 0) {
              await model.teamMembership.bulkCreate(membershipData);
          }
      }

      return res.status(201).json({success: true, message: 'Team created successfully', data: team})

  } catch (error) {
      return res.status(500).json({success: false, message: error.message})
  }
}

exports.getOneteam = async (req, res) => {
  const user = req.user;

  if (user.role !== 'admin') {
      return res.status(401).json({ message: 'You are not authorized to create a team' });
  }

  const { teamId } = req.params;
  
  try {
      // Get the company associated with the user
      const company = await model.company.findOne({ where: { UserId: user.id } });

      // Check if the team exists
      const team2 = await model.team.findOne({ where: { id: teamId } });

      // If team2 is null, return a response indicating the team was not found
      if (!team2) {
          return res.status(404).json({ success: false, message: 'Team not found' });
      }

      // If the company ID doesn't match the team’s companyId, return unauthorized
      if (company.id !== team2.companyId) {
          return res.status(401).json({ success: false, message: 'You are not authorized to view this team' });
      }

      // Fetch the team along with employees
      const team = await model.team.findOne({
          where: { id: teamId },
          include:[ {
              model: model.employee,
          }
        ]
          
      });

      if (!team) {
          return res.status(404).json({ success: false, message: 'Team not found' });
      }

      return res.status(200).json({ success: true, message: 'Team found successfully', data: team });
  } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
  }
};


exports.fetchTeamsForCompany = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains authenticated user details
    const { page = 1, limit = 10 } = req.query; // Default pagination values

    // Fetch the companyId associated with the user
    const user = await model.user.findOne({
      where: { id: userId },
      include: {
        model: model.company,
        attributes: ["id"], // Fetch only the companyId
      },
    });

    if (!user || user.companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found for the user",
      });
    }

    const companyId = user.companies[0].id; // Assuming a user can be associated with only one company

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Fetch teams for the company with pagination
    const { count, rows } = await model.team.findAndCountAll({
      where: { companyId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]], // Sorting by creation date (optional)
    });

    // Manually fetch employees for each team via the teamMembership table
    const teamsWithMembers = await Promise.all(
      rows.map(async (team) => {
        // Fetch all employees related to the team through teamMembership
        const teamMembers = await model.teamMembership.findAll({
          where: { teamId: team.id },
          include: {
            model: model.employee,
            include: {
              model: model.user, // Include user details for email and name
              attributes: ["id", "email"],
            },
            
          },
        });
        console.log("teamMembers", teamMembers)
       
        // Map the team data to include employees
        const employees = teamMembers.map((membership) => ({
          id: membership.employee.id,
          name: membership.employee.user.name,
          email: membership.employee.user.email,
          name:`${membership.employee.firstName} ${membership.employee.lastName}`,
          firstName: membership.employee.firstName,
          lastName: membership.employee.lastName,
          image: membership.employee.profile_image
        }));

        return {
          id: team.id,
          name: team.name,
          createdAt: team.createdAt,
          employees, // Include the fetched members for the team
        };
      })
    );

    // Response data
    const responseData = {
      totalRecords: count,
      totalPages: limit === "all" ? 1 : Math.ceil(count / limit),
      currentPage: limit === "all" ? 1 : parseInt(page),
      teamsWithMembers,
    };

    return res.status(200).json({
      success: true,
      message: "Teams fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching teams",
      error: error.message,
    });
  }
};


  exports.deleteTeam = async (req, res) => {
    const user = req.user
    if(user.role !== 'admin') {
        return res.status(401).json({message: 'You are not authorized to delete a team'})
    }
    const company = await model.company.findOne({where: {userId: user.id}})
    const {teamId} = req.params
    if(!teamId) {
        return res.status(400).json({message: 'Team id is required'})
    }
    try {
        const team = await model.team.findOne({where: {id: teamId,companyId: company.id}})
        if(!team) {
            return res.status(404).json({success: false, message: 'Team not found'})
        }
        await team.destroy()
        return res.status(200).json({success: true, message: 'Team deleted successfully'})
    } catch (error) {
        return res.status(500).json({sucess:false, message: error.message})
    }
  }


  exports.addEmployeeToTeam = async (req, res) => {

    const userId = req.user.id
    if(req.user.role !== 'admin') {
        return res.status(401).json({message: 'You are not authorized to add employee to a team'})
    }
    const {teamId, employeeId,roleInTeam} = req.body
    if(!teamId || !employeeId) {
        return res.status(400).json({message: 'teamId and employeeId are required'})
    }
    try {

        const team = await model.team.findOne({where: {id: teamId,companyId: userId}})
        if(!team) {
            return res.status(404).json({success: false, message: 'Team not found'})
        }
        const employee = await model.employee.findOne({where: {id: employeeId}})
        if(!employee) {
            return res.status(404).json({success: false, message: 'Employee not found'})
        }
        const existingMembership = await model.teamMembership.findOne({where: {teamId,employeeId}})
        if(existingMembership) {
            return res.status(400).json({success: false, message: 'Employee already added to team'})
        }
        await model.teamMembership.create({
            teamId: teamId,
            employeeId: employeeId,
            roleInTeam
        })
        return res.status(200).json({success: true, message: 'Employee added to team successfully'})
        
    } catch (error) {
        
        return res.status(500).json({sucess:false, message: error.message})
    }

  }


    exports.fetchTeamMembers = async (req, res) => {
        const userId = req.user.id
        const {teamId} = req.params
        if(!teamId) {
            return res.status(400).json({message: 'teamId is required'})
        }
        try {
            const team = await model.team.findOne({where: {id: teamId,companyId: userId}})
            if(!team) {
                return res.status(404).json({success: false, message: 'Team not found'})
            }
            const members = await model.teamMembership.findAll({where: {teamId}})
            return res.status(200).json({success: true, message: 'Team members fetched successfully', data:members})
        } catch (error) {
            return res.status(500).json({sucess:false, message: error.message})
        }
    }


    exports.removeEmployeeFromTeam = async (req, res) => {
        const userId = req.user.id
        if(req.user.role !== 'admin') {
            return res.status(401).json({message: 'You are not authorized to remove employee from a team'})
        }
        const company = await model.company.findOne({where: {userId: userId}})
        const {teamId, employeeId} = req.body
        if(!teamId || !employeeId) {
            return res.status(400).json({message: 'teamId and employeeId are required'})
        }
        try {
            const team = await model.team.findOne({where: {id: teamId,companyId: company.id}})
            if(!team) {
                return res.status(404).json({success: false, message: 'Team not found'})
            }
            const employee = await model.employee.findOne({where: {id: employeeId}})
            if(!employee) {
                return res.status(404).json({success: false, message: 'Employee not found'})
            }
            const existingModuleAssignment = await model.employeeModuleAssignment
            const existingMembership = await model.teamMembership.findOne({where: {teamId,employeeId}})
            if(!existingMembership) {
                return res.status(400).json({success: false, message: 'the following employee is not part of any team'})
            }
            await existingMembership.destroy()
            return res.status(200).json({success: true, message: 'Employee removed from team successfully'})
        } catch (error) {
            return res.status(500).json({sucess:false, message: error.message})
        }
    }

    exports.addTeamToProject = async (req, res) => {
        const userId = req.user.id
        const {taskId, teamId,roleInProject} = req.body
        if(req.user.role !== "admin"){
            return res.status(401).json({message: 'You are not authorized to add team to a project'})
        }
        const task = await model.task.findOne({where: {id: taskId}})
        const project = await model.project.findOne({where: {id: taskId}})
        if(project.companyId !== userId) {
            return res.status(401).json({message: 'You are not authorized to add team to a project'})
        }
        const team = await model.team.findOne({where: {id: teamId,companyId: userId}})
        if(!task || !team) {
            return res.status(404).json({success: false, message: 'task or Team not found for given company'})
        }
        const existingTeam = await model.teamTaskAssignment.findOne({where: {taskId,teamId}})
        if(existingTeam) {
            return res.status(400).json({success: false, message: 'Team already added to task'})
        }
        try {
            await model.teamTaskAssignment.create({
                taskId,
                teamId,
                roleInProject
            })

            const groupChat = await model.groupChat.create({
                name: `${project.name} - ${team.name}`
              });
              
              // Retrieve employee IDs for the given teamId
              const employeesIds = await model.teamMembership.findAll({
                where: { teamId },
                attributes: ['employeeId']
              });
              
              // Map the results to an array of employee IDs
              const employees = employeesIds.map(employee => employee.employeeId);
              
              // Prepare group chat membership entries
              const memberships = employees.map(employeeId => ({
                groupChatId: groupChat.id,
                employeeId
              }));
              
              // Bulk insert group chat memberships
              await model.groupChatMembership.bulkCreate(memberships);
              

            return res.status(200).json({success: true, message: 'Team added to project successfully'})
        } catch (error) {
             
            return res.status(500).json({sucess:false, message: error.message})
        }
    }


    exports.removeTeamFromProject = async (req, res) => {
        const userId = req.user.id;
        const { projectId, teamId } = req.body;
      
        // Check if the user is authorized
        if (req.user.role !== "admin") {
          return res.status(401).json({ message: "You are not authorized to remove a team from a project" });
        }
      
        try {
          // Check if the project exists for the given company
          const project = await model.project.findOne({ where: { id: projectId, companyId: userId } });
          if (!project) {
            return res.status(404).json({ success: false, message: "Project not found for the given company" });
          }
      
          // Check if the team exists for the given company
          const team = await model.team.findOne({ where: { id: teamId, companyId: userId } });
          if (!team) {
            return res.status(404).json({ success: false, message: "Team not found for the given company" });
          }
      
          // Check if the team is assigned to the project
          const projectTeamAssignment = await model.projectTeamAssignment.findOne({
            where: { projectId, teamId },
          });
          if (!projectTeamAssignment) {
            return res.status(400).json({
              success: false,
              message: "Team is not assigned to the specified project",
            });
          }
      
          // Remove the team from the project
          await projectTeamAssignment.destroy();
      
          return res.status(200).json({
            success: true,
            message: "Team removed from the project successfully",
          });
        } catch (error) {
          console.error("Error removing team from project:", error);
          return res.status(500).json({
            success: false,
            message: "An error occurred while removing the team from the project",
            error: error.message,
          });
        }
      };
      

      exports.getOneTeamDashboard = async (req, res) => {
        const teamId = req.query.id;
      
        try {
          // Validate `teamId`
          let team = await model.team.findOne({
            where: { id: teamId },
            include: [
              {
                model: model.employee,
              },
            ],
          });
          if (!team) {
            return res.status(404).json({
              success: false,
              message: "Team not found.",
            });
          }
      
          // Fetch all tasks for the team
          const allTasks = await model.task.findAll({
            include: [
              {
                model: model.team,
                through: { attributes: [] }, // Exclude intermediate table attributes
                where: { id: teamId },
                include:{
                  model:model.employee

                }
              },
              {
                model: model.modules,
                include:{
                  model:model.employee
                }
              },
            ],
          });
      
          // Separate tasks into `active`, `pending`, and `running` categories
          const activeTasks = [];
          const pendingTasks = [];
          const runningTasks = [];
      
          const currentDate = new Date();
      
          allTasks.forEach((task) => {
            const hasCompletedModule = task.modules.some(
              (module) => module.completionPercentage === 100
            );
      
            // Determine if the task is running
            const isRunning = task.endDate ? new Date(task.endDate) > currentDate : true;
      
            if (isRunning) {
              runningTasks.push(task);
            }
      
            // Categorize as active or pending
            if (hasCompletedModule) {
              activeTasks.push(task);
            } else {
              pendingTasks.push(task);
            }
          });
      
          // Get the total counts
          const totalActiveTasks = activeTasks.length;
          const totalPendingTasks = pendingTasks.length;
          const totalRunningTasks = runningTasks.length;
      
          // Convert team to plain object
          team = team.get({ plain: true });
      
          // Response
          res.status(200).json({
            success: true,
            message: "Team dashboard fetched successfully.",
            data: {
              totalTasks: allTasks.length, // Total tasks count
              totalPendingTasks,
              totalActiveTasks,
              totalRunningTasks,
              runningTasks,
              team
            },
          });
        } catch (error) {
          console.error("Error fetching team dashboard:", error);
          res.status(500).json({
            success: false,
            message: "An error occurred while fetching the team dashboard.",
            error: error.message,
          });
        }
      };
      