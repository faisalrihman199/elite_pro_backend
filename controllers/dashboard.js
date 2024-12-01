const model = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');
const Sequelize = require("../config/db")

exports.dashBoardStats = async (req, res) => {
    const userId = req.user.id;
    const period = req.query.period;

    // Validate the period
    if (!['daily', 'weekly', 'monthly', 'all'].includes(period)) {
        return res.status(400).json({ message: 'Invalid period' });
    }

    try {
        // Total counts for employees, projects, and tasks
        const TotalEmployees = await model.employee.count({ where: { companyId: userId } });
        const TotalProjects = await model.project.count({ where: { companyId: userId } });
        const TotalTasks = await model.task.count({
            include: [{
                model: model.project,
                where: { companyId: userId },
                attributes: []
            }]
        });
        if (period === 'daily') {
            // Get the date and day name for the last 7 days
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days');
                last7Days.push({
                    date: date.format('YYYY-MM-DD'),
                    day: date.format('ddd') // Full day name (e.g., Monday, Tuesday)
                });
            }
        
            const employeeCounts = [];
            const taskCounts = [];
            const projectCounts = [];
        
            // Get daily counts for employees
            for (let day of last7Days) {
                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: moment(day.date).startOf('day').toDate(),
                            [Op.lte]: moment(day.date).endOf('day').toDate()
                        }
                    }
                });
                employeeCounts.push({ name: day.day, value: employeeCount });
            }
        
            // Get daily counts for tasks
            for (let day of last7Days) {
                const taskCount = await model.task.count({
                    include: [{
                        model: model.project,
                        where: { companyId: userId },
                        attributes: []
                    }],
                    where: {
                        createdAt: {
                            [Op.gte]: moment(day.date).startOf('day').toDate(),
                            [Op.lte]: moment(day.date).endOf('day').toDate()
                        }
                    }
                });
                taskCounts.push({ name: day.day, value: taskCount });
            }
        
            // Get daily counts for projects
            for (let day of last7Days) {
                const projectCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: moment(day.date).startOf('day').toDate(),
                            [Op.lte]: moment(day.date).endOf('day').toDate()
                        }
                    }
                });
                projectCounts.push({ name: day.day, value: projectCount });
            }
        
            // Return the daily counts for employees, tasks, and projects
            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalProjects,
                    TotalTasks,
                    employeeCounts,
                    taskCounts,
                    projectCounts
                }
            });
        }
        
        if (period === 'monthly') {
            // Yearly logic for the last 12 months
            const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                last12Months.push(moment().subtract(i, 'months').format('MMM')); // Short month name
            }

            const employeeCounts = [];
            const taskCounts = [];
            const projectCounts = [];

            for (let i = 11; i >= 0; i--) {
                const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
                const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();

                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                employeeCounts.push({ name: last12Months[11 - i], value: employeeCount });

                const taskCount = await model.task.count({
                    include: [{
                        model: model.project,
                        where: { companyId: userId },
                        attributes: []
                    }],
                    where: {
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                taskCounts.push({ name: last12Months[11 - i], value: taskCount });

                const projectCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                projectCounts.push({ name: last12Months[11 - i], value: projectCount });
            }

            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalProjects,
                    TotalTasks,
                    employeeCounts,
                    taskCounts,
                    projectCounts
                }
            });
        }
        if (period === 'weekly') {
            // Calculate the last 4 weeks and their ranges
            const last4Weeks = [];
            for (let i = 3; i >= 0; i--) {
                const startOfWeek = moment().subtract(i, 'weeks').startOf('week');
                const endOfWeek = moment().subtract(i, 'weeks').endOf('week');
                last4Weeks.push({
                    range: `${startOfWeek.format('D MMM')} to ${endOfWeek.format('D MMM')}`,
                    start: startOfWeek,
                    end: endOfWeek
                });
            }

            const employeeCounts = [];
            const taskCounts = [];
            const projectCounts = [];

            // Get weekly counts for employees, tasks, and projects
            for (let week of last4Weeks) {
                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: week.start.toDate(),
                            [Op.lte]: week.end.toDate()
                        }
                    }
                });
                employeeCounts.push({ name: week.range, value: employeeCount });

                const taskCount = await model.task.count({
                    include: [{
                        model: model.project,
                        where: { companyId: userId },
                        attributes: []
                    }],
                    where: {
                        createdAt: {
                            [Op.gte]: week.start.toDate(),
                            [Op.lte]: week.end.toDate()
                        }
                    }
                });
                taskCounts.push({ name: week.range, value: taskCount });

                const projectCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: week.start.toDate(),
                            [Op.lte]: week.end.toDate()
                        }
                    }
                });
                projectCounts.push({ name: week.range, value: projectCount });
            }

            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalProjects,
                    TotalTasks,
                    employeeCounts,
                    taskCounts,
                    projectCounts
                }
            });
        }
        if (period === 'all') {
            // Get data for the current year and the last 9 years
            const last10Years = [];
            for (let i = 0; i < 10; i++) {
                const year = moment().subtract(i, 'years').year();
                last10Years.push(year);
            }

            const employeeCounts = [];
            const taskCounts = [];
            const projectCounts = [];

            for (let year of last10Years) {
                const yearStart = moment().year(year).startOf('year').toDate();
                const yearEnd = moment().year(year).endOf('year').toDate();

                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                employeeCounts.push({ name:year, value: employeeCount });

                const taskCount = await model.task.count({
                    include: [{
                        model: model.project,
                        where: { companyId: userId },
                        attributes: []
                    }],
                    where: {
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                taskCounts.push({ name:year, value: taskCount });

                const projectCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                projectCounts.push({ name:year, value: projectCount });
            }

            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalProjects,
                    TotalTasks,
                    employeeCounts,
                    taskCounts,
                    projectCounts
                }
            });
        }
        

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while fetching data.' });
    }
};


exports.employeeStats = async (req, res) => {
    const userId = req.user.id;
    const period = req.query.period;

    // Validate the period
    if (!['daily', 'weekly', 'monthly', 'all'].includes(period)) {
        return res.status(400).json({ message: 'Invalid period' });
    }

    try {
        // Total employees for the company
        const TotalEmployees = await model.employee.count({ where: { companyId: userId } });

        // Active employees: employees linked to active projects in teamMembership
        const TotalActiveEmployeeCount = await model.employee.count({
            include: [
                {
                    model: model.team, // Include teams the employee is part of
                    through: { // Through the teamMembership table
                        attributes: [] // We don't need attributes from the teamMembership table, just the association
                    },
                    required: true // Ensure only employees that belong to a team are counted
                }
            ],
            where: { companyId: userId }
        });

        // Inactive employees: employees who do not have any team membership
        const TotalInactiveEmployeeCount = await model.employee.count({
            include: [
                {
                    model: model.team,
                    through: { attributes: [] },
                    required: false // Left join to include employees with no teams
                }
            ],
            where: {
                "$teams.id$": null, // Filter employees who do not belong to any team
                companyId: userId
            }
        });

        // Period-based logic
        if (period === 'weekly') {
            // Get the last 4 weeks
            const last4Weeks = [];
            for (let i = 3; i >= 0; i--) {
                const startOfWeek = moment().subtract(i, 'weeks').startOf('week');
                const endOfWeek = moment().subtract(i, 'weeks').endOf('week');
                last4Weeks.push({
                    range: `${startOfWeek.format('D MMM')} to ${endOfWeek.format('D MMM')}`,
                    start: startOfWeek,
                    end: endOfWeek
                });
            }

            const employeeCounts = [];
            const activeEmployeeCounts = [];
            const inactiveEmployeeCounts = [];

            // Get weekly counts for employees created
            for (let week of last4Weeks) {
                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: week.start.toDate(),
                            [Op.lte]: week.end.toDate()
                        }
                    }
                });
                employeeCounts.push({ name: week.range, value: employeeCount });
            }

            // Get weekly counts for active employees
            for (let week of last4Weeks) {
                const activeEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: true
                        }
                    ],
                    distinct: true,
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: week.start.toDate(),
                            [Op.lte]: week.end.toDate()
                        }
                    }
                });
                activeEmployeeCounts.push({ name: week.range, value: activeEmployeeCount });
            }

            // Get weekly counts for inactive employees
            for (let week of last4Weeks) {
                const inactiveEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: false
                        }
                    ],
                    where: {
                        "$teams.id$": null, // Employees with no teams
                        createdAt: {
                            [Op.gte]: week.start.toDate(),
                            [Op.lte]: week.end.toDate()
                        },
                        companyId: userId
                    }
                });
                inactiveEmployeeCounts.push({ name: week.range, value: inactiveEmployeeCount });
            }

            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalActiveEmployeeCount,
                    TotalInactiveEmployeeCount,
                    employeeCounts,
                    activeEmployeeCounts,
                    inactiveEmployeeCounts
                }
            });
        }

        if (period === 'daily') {
            // Get the last 7 days
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days');
                last7Days.push({
                    date: date.format('YYYY-MM-DD'),
                    day: date.format('dddd')
                });
            }

            const employeeCounts = [];
            const activeEmployeeCounts = [];
            const inactiveEmployeeCounts = [];

            // Get daily counts for employees created
            for (let day of last7Days) {
                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: moment(day.date).startOf('day').toDate(),
                            [Op.lte]: moment(day.date).endOf('day').toDate()
                        }
                    }
                });
                employeeCounts.push({ name: day.day, value: employeeCount });
            }

            // Get daily counts for active employees
            for (let day of last7Days) {
                const activeEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: true
                        }
                    ],
                    distinct: true,
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: moment(day.date).startOf('day').toDate(),
                            [Op.lte]: moment(day.date).endOf('day').toDate()
                        }
                    }
                });
                activeEmployeeCounts.push({ name: day.day, value: activeEmployeeCount });
            }

            // Get daily counts for inactive employees
            for (let day of last7Days) {
                const inactiveEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: false
                        }
                    ],
                    where: {
                        "$teams.id$": null, // Employees with no teams
                        createdAt: {
                            [Op.gte]: moment(day.date).startOf('day').toDate(),
                            [Op.lte]: moment(day.date).endOf('day').toDate()
                        },
                        companyId: userId
                    }
                });
                inactiveEmployeeCounts.push({ name: day.day, value: inactiveEmployeeCount });
            }

            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalActiveEmployeeCount,
                    TotalInactiveEmployeeCount,
                    employeeCounts,
                    activeEmployeeCounts,
                    inactiveEmployeeCounts
                }
            });
        }

        if (period === 'monthly') {
            // Get the last 12 months
            const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                last12Months.push(moment().subtract(i, 'months').format('MMM')); // Short month name
            }

            const employeeCounts = [];
            const activeEmployeeCounts = [];
            const inactiveEmployeeCounts = [];

            for (let i = 11; i >= 0; i--) {
                const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
                const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();

                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                employeeCounts.push({ name: last12Months[11 - i], value: employeeCount });

                const activeEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: true
                        }
                    ],
                    distinct: true,
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                activeEmployeeCounts.push({ name: last12Months[11 - i], value: activeEmployeeCount });

                const inactiveEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: false
                        }
                    ],
                    where: {
                        "$teams.id$": null, // Employees with no teams
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                inactiveEmployeeCounts.push({ name: last12Months[11 - i], value: inactiveEmployeeCount });
            }

            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalActiveEmployeeCount,
                    TotalInactiveEmployeeCount,
                    employeeCounts,
                    activeEmployeeCounts,
                    inactiveEmployeeCounts
                }
            });
        }

        // For "all" period, we will just return the totals
        if (period === 'all') {
            // Get the last 10 years
            const last10Years = [];
            for (let i = 9; i >= 0; i--) {
                last10Years.push(moment().subtract(i, 'years').format('YYYY')); // Get the year (e.g., 2024, 2023, ...)
            }
        
            const employeeCounts = [];
            const activeEmployeeCounts = [];
            const inactiveEmployeeCounts = [];
        
            for (let i = 9; i >= 0; i--) {
                const yearStart = moment().subtract(i, 'years').startOf('year').toDate();
                const yearEnd = moment().subtract(i, 'years').endOf('year').toDate();
        
                const employeeCount = await model.employee.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                employeeCounts.push({ name: last10Years[9 - i], value: employeeCount });
        
                const activeEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: true
                        }
                    ],
                    distinct: true,
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                activeEmployeeCounts.push({ name: last10Years[9 - i], value: activeEmployeeCount });
        
                const inactiveEmployeeCount = await model.employee.count({
                    include: [
                        {
                            model: model.team,
                            through: { attributes: [] },
                            required: false
                        }
                    ],
                    where: {
                        "$teams.id$": null, // Employees with no teams
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                inactiveEmployeeCounts.push({ name: last10Years[9 - i], value: inactiveEmployeeCount });
            }
        
            return res.status(200).json({
                success: true,
                data: {
                    TotalEmployees,
                    TotalActiveEmployeeCount,
                    TotalInactiveEmployeeCount,
                    employeeCounts,
                    activeEmployeeCounts,
                    inactiveEmployeeCounts
                }
            });
        }
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};



exports.projectStats = async (req, res) => {
    const userId = req.user.id;
    try {
        const TotalProjects = await model.project.count({ where: { companyId: userId } });
        const TotalActiveProjects = await model.project.count({ where: { companyId: userId, status: 'active' } });
        const TotalCompletedProjects = await model.project.count({ where: { companyId: userId, status: 'completed' } })
        const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                last12Months.push(moment().subtract(i, 'months').format('MMM')); // Short month name
            }
        const projectCounts = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
            const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();
            const projectCount = await model.project.count({
                
                where: {
                    companyId: userId,
                    createdAt: {
                        [Op.gte]: monthStart,
                        [Op.lte]: monthEnd
                    }
                }
            });
            projectCounts.push({ month: last12Months[11 - i], count: projectCount });
        }
        return res.status(200).json({
            success: true,
            message: 'Project stats fetched successfully',
            data: {
                TotalProjects,
                TotalActiveProjects,
                TotalCompletedProjects,
                projectCounts
            }
        });

        
    } catch (error) {

        return res.status(500).json({success: false, message:error.message });
        
    }
}



exports.taskStats = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get the user's role and find the associated company
        const user = await model.user.findOne({
            where: { id: userId },
            include: [{
                model: model.company,
                attributes: ['id'],
                required: true,
                limit: 1 // Ensure only one company is fetched (in case of multiple companies)
            }]
        });
        
        console.log("user",user);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access, admin role required' });
        }

        const companyId = user.companies[0].id;

        // Total tasks for the company
        const TotalTasks = await model.task.count({
            where: { projectId: { [Op.in]: await model.project.findAll({ where: { companyId }, attributes: ['id'], raw: true }).then(projects => projects.map(project => project.id)) } }
        });

        // Total active tasks
        const TotalActiveTasks = await model.task.count({
            where: { projectId: { [Op.in]: await model.project.findAll({ where: { companyId }, attributes: ['id'], raw: true }).then(projects => projects.map(project => project.id)) }, status: 'active' }
        });

        // Total completed tasks
        const TotalCompletedTasks = await model.task.count({
            where: { projectId: { [Op.in]: await model.project.findAll({ where: { companyId }, attributes: ['id'], raw: true }).then(projects => projects.map(project => project.id)) }, status: 'completed' }
        });

        // Get the last 12 months
        const last12Months = [];
        for (let i = 11; i >= 0; i--) {
            last12Months.push(moment().subtract(i, 'months').format('MMM')); // Short month name
        }

        const taskCounts = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
            const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();

            // Count tasks created in the month
            const taskCount = await model.task.count({
                where: {
                    projectId: { [Op.in]: await model.project.findAll({ where: { companyId }, attributes: ['id'], raw: true }).then(projects => projects.map(project => project.id)) },
                    createdAt: {
                        [Op.gte]: monthStart,
                        [Op.lte]: monthEnd
                    }
                }
            });

            taskCounts.push({ month: last12Months[11 - i], count: taskCount });
        }

        return res.status(200).json({
            success: true,
            message: 'Task stats fetched successfully',
            data: {
                TotalTasks,
                TotalActiveTasks,
                TotalCompletedTasks,
                taskCounts
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.moduleStats = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get the user's role and find the associated company
        const user = await model.user.findOne({
            where: { id: userId },
            include: [{
                model: model.company,
                attributes: ['id'],
                required: true,
                limit: 1 // Ensure only one company is fetched (in case of multiple companies)
            }]
        });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access, admin role required' });
        }

        const companyId = user.companies[0].id;

        // Get project IDs for the company
        const projectIds = await model.project.findAll({
            where: { companyId },
            attributes: ['id'],
            raw: true
        }).then(projects => projects.map(project => project.id));

        // Get task IDs associated with the projects
        const taskIds = await model.task.findAll({
            where: { projectId: { [Op.in]: projectIds } },
            attributes: ['id'],
            raw: true
        }).then(tasks => tasks.map(task => task.id));

        // Total modules for the company
        const TotalModules = await model.modules.count({
            where: { taskId: { [Op.in]: taskIds } }
        });

        // Total active modules
        const TotalActiveModules = await model.modules.count({
            where: { taskId: { [Op.in]: taskIds }, status: 'active' }
        });

        // Total completed modules
        const TotalCompletedModules = await model.modules.count({
            where: { taskId: { [Op.in]: taskIds }, status: 'completed' }
        });

        // Get the last 12 months
        const last12Months = [];
        for (let i = 11; i >= 0; i--) {
            last12Months.push(moment().subtract(i, 'months').format('MMM')); // Short month name
        }

        const moduleCounts = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
            const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();

            // Count modules created in the month
            const moduleCount = await model.modules.count({
                where: {
                    taskId: { [Op.in]: taskIds },
                    createdAt: {
                        [Op.gte]: monthStart,
                        [Op.lte]: monthEnd
                    }
                }
            });

            moduleCounts.push({ month: last12Months[11 - i], count: moduleCount });
        }

        return res.status(200).json({
            success: true,
            message: 'Module stats fetched successfully',
            data: {
                TotalModules,
                TotalActiveModules,
                TotalCompletedModules,
                moduleCounts
            }
        });

    } catch (error) {
        console.error("Error fetching module stats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
