const model = require('../models');

exports.getEmployeeInfo = async (req, res) => {
    try {
        const user = req.user;

        // Check if the user's role is 'employee'
        if (user.role !== 'employee') {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Fetch the employee data along with related teams, projects, and tasks
        const employee = await model.employee.findOne({
            where: { userId: user.id },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [
                {
                    model: model.teamMembership,
                    attributes: ["teamId"], // Don't include any attributes from teamMembership
                    include: {
                        model: model.team,
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        include: {
                            model: model.projectTeamAssignment,
                            attributes: ['projectId'],
                            include: {
                                model: model.project,
                                attributes: { exclude: ['createdAt', 'updatedAt'] }
                            }
                        }
                    }
                },
                {
                    model: model.task,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    include: {
                        model: model.modules,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                }
            ]
        });

        // If no employee found, return an error message
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        // Prepare a custom response with flattened structure
        const teams = employee.teamMemberships.map(teamMembership => {
            const teamData = teamMembership.Team;
            const projects = teamMembership.Team.projectTeamAssignments.map(assignment => assignment.project);
            return {
                teamId: teamData.id,
                teamName: teamData.name,
                teamDescription: teamData.description,
                projects: projects.map(project => ({
                    projectId: project.id,
                    projectName: project.name,
                    projectDescription: project.description,
                    projectBudget: project.budget,
                    projectStatus: project.status
                }))
            };
        });

        // Delete the original teamMemberships field after transforming the data
        delete employee['teamMemberships'];

        // Return the employee info with all their teams and projects
        return res.status(200).json({
            success: true,
            data: { 
                ...employee.toJSON(), 
                teamMemberships:null,
                teams 
            }
        });

    } catch (error) {
        // Handle errors gracefully and log them if necessary
        console.error("Error fetching employee info:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



