const model = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');
const sequelize = require("../config/db")

exports.dashBoardStats = async (req, res) => {
    const userId = req.user.id;
    const period = req.query.period;
    const company = await model.company.findOne({ where: { UserId:userId } });
    // Validate the period
    if (!['daily', 'weekly', 'monthly', 'all'].includes(period)) {
        return res.status(400).json({ message: 'Invalid period' });
    }

    try {
        // Total counts for employees, projects, and tasks
        const TotalEmployees = await model.employee.count({ where: { companyId:company.id } });
        const TotalProjects = await model.project.count({ where: { companyId: company.id } });
        const TotalTasks = await model.task.count({
            include: [{
                model: model.project,
                where: { companyId: company.id },
                
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
                        companyId: company.id,
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
                        where: { companyId: company.id },
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        where: { companyId: company.id },
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        where: { companyId: company.id },
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        where: { companyId: company.id },
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
                        companyId: company.id,
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

    const company = await model.company.findOne({ where: { UserId:userId } });

    try {
        // Total employees for the company
        const TotalEmployees = await model.employee.count({ where: { companyId: company.id } });
        console.log("TotalEmployees",TotalEmployees);
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
            distinct: true,
            where: { companyId: company.id }
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
                companyId: company.id
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        companyId: company.id
                    }
                });
                inactiveEmployeeCounts.push({ name: week.range, value: inactiveEmployeeCount });
            }

            return res.status(200).json({
                success: true,
                message: 'employee Data fetched successfully',
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        companyId: company.id
                    }
                });
                inactiveEmployeeCounts.push({ name: day.day, value: inactiveEmployeeCount });
            }

            return res.status(200).json({
                success: true,
                message: 'employee Data fetched successfully',
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        },
                        companyId: company.id
                        
                    }
                });
                inactiveEmployeeCounts.push({ name: last12Months[11 - i], value: inactiveEmployeeCount });
            }

            return res.status(200).json({
                success: true,
                message: 'employee Data fetched successfully',
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
                        companyId: company.id,
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
                        companyId: company.id,
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
                        },
                        companyId: company.id
                    }
                });
                inactiveEmployeeCounts.push({ name: last10Years[9 - i], value: inactiveEmployeeCount });
            }
        
            return res.status(200).json({
                success: true,
                message: 'employee Data fetched successfully',
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
    const user = req.user;

    if (user.role !== "admin") {
        return res.status(401).json({ message: "You are not authorized to access this route." });
    }

    const company = await model.company.findOne({ where: { UserId: user.id } });
    const userId = company.id;
    const period = req.query.period || "all"; // Default to 'all' if no period is provided

    try {
        // Common Stats
        const TotalProjects = await model.project.count({ where: { companyId: userId } });
        const TotalActiveProjects = await model.project.count({ where: { companyId: userId, status: "active" } });
        const TotalCompletedProjects = await model.project.count({ where: { companyId: userId, status: "completed" } });

        let projectCounts = {
            total: [],
            active: [],
            completed: [],
            chartData: []
        };

        if (period === "monthly") {
            // Monthly stats for the last 12 months
            const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                last12Months.push(moment().subtract(i, "months").format("MMM")); // Short month name
            }

            for (let i = 11; i >= 0; i--) {
                const monthStart = moment().subtract(i, "months").startOf("month").toDate();
                const monthEnd = moment().subtract(i, "months").endOf("month").toDate();

                // Get counts for total, active, and completed projects in the month
                const totalCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd,
                        },
                    },
                });
                const activeCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "active",
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd,
                        },
                    },
                });
                const completedCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "completed",
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd,
                        },
                    },
                });

                // Store the counts in the response object
                projectCounts.total.push({ name: last12Months[11 - i], value: totalCount });
                projectCounts.active.push({ name: last12Months[11 - i], value: activeCount });
                projectCounts.completed.push({ name: last12Months[11 - i], value: completedCount });
            }
        } else if (period === "weekly") {
            // Weekly stats for the last 4 weeks (returns date ranges)
            for (let i = 3; i >= 0; i--) {
                const weekStart = moment().subtract(i, "weeks").startOf("week");
                const weekEnd = moment().subtract(i, "weeks").endOf("week");

                // Get counts for total, active, and completed projects in the week
                const totalCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: weekStart.toDate(),
                            [Op.lte]: weekEnd.toDate(),
                        },
                    },
                });
                const activeCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "active",
                        createdAt: {
                            [Op.gte]: weekStart.toDate(),
                            [Op.lte]: weekEnd.toDate(),
                        },
                    },
                });
                const completedCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "completed",
                        createdAt: {
                            [Op.gte]: weekStart.toDate(),
                            [Op.lte]: weekEnd.toDate(),
                        },
                    },
                });

                projectCounts.total.push({
                    name: `${weekStart.format("MMM D")} - ${weekEnd.format("MMM D")}`,
                    value: totalCount,
                });
                projectCounts.active.push({
                    name: `${weekStart.format("MMM D")} - ${weekEnd.format("MMM D")}`,
                    value: activeCount,
                });
                projectCounts.completed.push({
                    name: `${weekStart.format("MMM D")} - ${weekEnd.format("MMM D")}`,
                    value: completedCount,
                });
            }
        } else if (period === "daily") {
            // Daily stats for the last 7 days (returns day names like Mon, Tue, etc.)
            for (let i = 6; i >= 0; i--) {
                const dayStart = moment().subtract(i, "days").startOf("day").toDate();
                const dayEnd = moment().subtract(i, "days").endOf("day").toDate();

                // Get counts for total, active, and completed projects in the day
                const totalCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: dayStart,
                            [Op.lte]: dayEnd,
                        },
                    },
                });
                const activeCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "active",
                        createdAt: {
                            [Op.gte]: dayStart,
                            [Op.lte]: dayEnd,
                        },
                    },
                });
                const completedCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "completed",
                        createdAt: {
                            [Op.gte]: dayStart,
                            [Op.lte]: dayEnd,
                        },
                    },
                });

                projectCounts.total.push({
                    name: moment(dayStart).format("ddd"), // Returns day name (e.g., "Mon", "Tue")
                    value: totalCount,
                });
                projectCounts.active.push({
                    name: moment(dayStart).format("ddd"),
                    value: activeCount,
                });
                projectCounts.completed.push({
                    name: moment(dayStart).format("ddd"),
                    value: completedCount,
                });
            }
        } else if (period === "all") {
            // Yearly stats for the last 10 years, including the current year
            const last10Years = [];
            for (let i = 9; i >= 0; i--) {
                const year = moment().subtract(i, "years").year();
                last10Years.push(year);
            }

            for (const year of last10Years) {
                const yearStart = moment(`${year}-01-01`).startOf("year").toDate();
                const yearEnd = moment(`${year}-12-31`).endOf("year").toDate();

                // Get counts for total, active, and completed projects in the year
                const totalCount = await model.project.count({
                    where: {
                        companyId: userId,
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd,
                        },
                    },
                });
                const activeCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "active",
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd,
                        },
                    },
                });
                const completedCount = await model.project.count({
                    where: {
                        companyId: userId,
                        status: "completed",
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd,
                        },
                    },
                });

                projectCounts.total.push({ name: `${year}`, value: totalCount });
                projectCounts.active.push({ name: `${year}`, value: activeCount });
                projectCounts.completed.push({ name: `${year}`, value: completedCount });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid period. Allowed values are 'monthly', 'weekly', 'daily', or 'all'.",
            });
        }

        // Fixing chartData to summarize the totals for total, active, and completed projects
        const totalProjectsCount = projectCounts.total.reduce((sum, val) => sum + val.value, 0);
        const activeProjectsCount = projectCounts.active.reduce((sum, val) => sum + val.value, 0);
        const completedProjectsCount = projectCounts.completed.reduce((sum, val) => sum + val.value, 0);

        // Updating chartData with the fixed format
        projectCounts.chartData = [
            { label: "Total Projects", value: totalProjectsCount },
            { label: "Active Projects", value: activeProjectsCount },
            { label: "Completed Projects", value: completedProjectsCount },
        ];

        // Return the results in both the chartData format and the name-count format
        return res.status(200).json({
            success: true,
            message: "Project stats fetched successfully",
            data: {
                TotalProjects,
                TotalActiveProjects,
                TotalCompletedProjects,
                total: projectCounts.total,
                active: projectCounts.active,
                completed: projectCounts.completed,
                chartData: projectCounts.chartData
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



exports.taskStats = async (req, res) => {
    const userId = req.user.id;
    const { period = 'all' } = req.query; // Default to 'all' if no period is specified

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

        // Fetch all project IDs for the company
        const projectIds = await model.project.findAll({
            where: { companyId },
            attributes: ['id'],
            raw: true
        }).then(projects => projects.map(project => project.id));

        // Define the date range for the period
        let dateRange = {};
        if (period === 'daily') {
            dateRange = {
                [Op.gte]: moment().startOf('day').toDate(),
                [Op.lte]: moment().endOf('day').toDate()
            };
        } else if (period === 'weekly') {
            dateRange = {
                [Op.gte]: moment().startOf('week').toDate(),
                [Op.lte]: moment().endOf('week').toDate()
            };
        } else if (period === 'monthly') {
            dateRange = {
                [Op.gte]: moment().startOf('month').toDate(),
                [Op.lte]: moment().endOf('month').toDate()
            };
        }

        // Total tasks for the company (filtered by period if applicable)
        const TotalTasks = await model.task.count({
            where: {
                projectId: { [Op.in]: projectIds },
            }
        });

        // Total active tasks
        const TotalActiveTasks = await model.task.count({
            where: {
                projectId: { [Op.in]: projectIds },
                status: 'active',
            }
        });

        // Total completed tasks
        const TotalCompletedTasks = await model.task.count({
            where: {
                projectId: { [Op.in]: projectIds },
                status: 'completed',
            }
        });

        // Task counts for the specified period
        let taskCounts = [];
        if (period === 'daily') {
            // Daily stats for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const dayStart = moment().subtract(i, 'days').startOf('day').toDate();
                const dayEnd = moment().subtract(i, 'days').endOf('day').toDate();
                const taskCount = await model.task.count({
                    where: {
                        projectId: { [Op.in]: projectIds },
                        createdAt: {
                            [Op.gte]: dayStart,
                            [Op.lte]: dayEnd
                        }
                    }
                });
                taskCounts.push({ name: moment(dayStart).format('ddd'), value: taskCount });
            }
        } else if (period === 'weekly') {
            // Weekly stats for the last 8 weeks
            for (let i = 7; i >= 0; i--) {
                const weekStart = moment().subtract(i, 'weeks').startOf('week').toDate();
                const weekEnd = moment().subtract(i, 'weeks').endOf('week').toDate();
                const taskCount = await model.task.count({
                    where: {
                        projectId: { [Op.in]: projectIds },
                        createdAt: {
                            [Op.gte]: weekStart,
                            [Op.lte]: weekEnd
                        }
                    }
                });
                taskCounts.push({
                    name: `${moment(weekStart).format('MMM D')} - ${moment(weekEnd).format('MMM D')}`,
                    value: taskCount
                });
            }
        } else if (period === 'monthly') {
            // Monthly stats for the last 12 months
            for (let i = 11; i >= 0; i--) {
                const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
                const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();
                const taskCount = await model.task.count({
                    where: {
                        projectId: { [Op.in]: projectIds },
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                taskCounts.push({ name: moment(monthStart).format('MMM'), value: taskCount });
            }
        } else if (period === 'all') {
            // Yearly stats for the last 10 years
            for (let i = 9; i >= 0; i--) {
                const yearStart = moment().subtract(i, 'years').startOf('year').toDate();
                const yearEnd = moment().subtract(i, 'years').endOf('year').toDate();
                const taskCount = await model.task.count({
                    where: {
                        projectId: { [Op.in]: projectIds },
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                taskCounts.push({ name: moment(yearStart).format('YYYY'), value: taskCount });
            }
        }

        // Add chartData for summary (Total Tasks, Active Tasks, Completed Tasks)
        const totalTaskCount = taskCounts.reduce((sum, val) => sum + val.value, 0);
        const activeTaskCount = await model.task.count({
            where: {
                projectId: { [Op.in]: projectIds },
                status: 'active',
                createdAt: dateRange
            }
        });
        const completedTaskCount = await model.task.count({
            where: {
                projectId: { [Op.in]: projectIds },
                status: 'completed',
                createdAt: dateRange
            }
        });

        // Adding summary chart data
        const chartData = [
            { label: "Total Tasks", value: totalTaskCount },
            { label: "Active Tasks", value: activeTaskCount },
            { label: "Completed Tasks", value: completedTaskCount },
        ];

        return res.status(200).json({
            success: true,
            message: 'Task stats fetched successfully',
            data: {
                TotalTasks,
                TotalActiveTasks,
                TotalCompletedTasks,
                taskCounts,
                chartData // Return the chartData for summary
            }
        });

    } catch (error) {
        console.error("Error fetching task stats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.moduleStats = async (req, res) => {
    const userId = req.user.id;
    const { period = 'all' } = req.query; // Default to 'all' if no period is specified

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

        // Define the date range based on the period
        let dateRange = {};
        if (period === 'daily') {
            dateRange = {
                [Op.gte]: moment().startOf('day').toDate(),
                [Op.lte]: moment().endOf('day').toDate()
            };
        } else if (period === 'weekly') {
            dateRange = {
                [Op.gte]: moment().startOf('week').toDate(),
                [Op.lte]: moment().endOf('week').toDate()
            };
        } else if (period === 'monthly') {
            dateRange = {
                [Op.gte]: moment().startOf('month').toDate(),
                [Op.lte]: moment().endOf('month').toDate()
            };
        }

        // Total modules for the company (filtered by period if applicable)
        const TotalModules = await model.modules.count({
            where: {
                taskId: { [Op.in]: taskIds },
                ...(period !== 'all' && { createdAt: dateRange })
            }
        });

        // Total active modules
        const TotalActiveModules = await model.modules.count({
            where: {
                taskId: { [Op.in]: taskIds },
                status: { [Op.not]: 'completed' }, // Exclude 'completed' status
                ...(period !== 'all' && { createdAt: dateRange })
            }
        });

        // Total completed modules
        const TotalCompletedModules = await model.modules.count({
            where: {
                taskId: { [Op.in]: taskIds },
                status: 'completed',
                ...(period !== 'all' && { createdAt: dateRange })
            }
        });

        // Module counts for the specified period
        let moduleCounts = [];
        let chartData = [];

        // Collecting the task stats in a similar format
        chartData.push({ label: 'Total Modules', value: TotalModules });
        chartData.push({ label: 'Active Modules', value: TotalActiveModules });
        chartData.push({ label: 'Completed Modules', value: TotalCompletedModules });

        // Generate daily, weekly, monthly or yearly module counts based on the period
        if (period === 'daily') {
            // Daily stats for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const dayStart = moment().subtract(i, 'days').startOf('day').toDate();
                const dayEnd = moment().subtract(i, 'days').endOf('day').toDate();
                const moduleCount = await model.modules.count({
                    where: {
                        taskId: { [Op.in]: taskIds },
                        createdAt: {
                            [Op.gte]: dayStart,
                            [Op.lte]: dayEnd
                        }
                    }
                });
                moduleCounts.push({ name: moment(dayStart).format('ddd'), value: moduleCount });
            }
        } else if (period === 'weekly') {
            // Weekly stats for the last 8 weeks
            for (let i = 7; i >= 0; i--) {
                const weekStart = moment().subtract(i, 'weeks').startOf('week').toDate();
                const weekEnd = moment().subtract(i, 'weeks').endOf('week').toDate();
                const moduleCount = await model.modules.count({
                    where: {
                        taskId: { [Op.in]: taskIds },
                        createdAt: {
                            [Op.gte]: weekStart,
                            [Op.lte]: weekEnd
                        }
                    }
                });
                moduleCounts.push({
                    name: `${moment(weekStart).format('MMM D')} - ${moment(weekEnd).format('MMM D')}`,
                    value: moduleCount
                });
            }
        } else if (period === 'monthly') {
            // Monthly stats for the last 12 months
            for (let i = 11; i >= 0; i--) {
                const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
                const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();
                const moduleCount = await model.modules.count({
                    where: {
                        taskId: { [Op.in]: taskIds },
                        createdAt: {
                            [Op.gte]: monthStart,
                            [Op.lte]: monthEnd
                        }
                    }
                });
                moduleCounts.push({ name: moment(monthStart).format('MMM'), value: moduleCount });
            }
        } else if (period === 'all') {
            // Yearly stats for the last 10 years
            for (let i = 9; i >= 0; i--) {
                const yearStart = moment().subtract(i, 'years').startOf('year').toDate();
                const yearEnd = moment().subtract(i, 'years').endOf('year').toDate();
                const moduleCount = await model.modules.count({
                    where: {
                        taskId: { [Op.in]: taskIds },
                        createdAt: {
                            [Op.gte]: yearStart,
                            [Op.lte]: yearEnd
                        }
                    }
                });
                moduleCounts.push({ name: moment(yearStart).format('YYYY'), value: moduleCount });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Module stats fetched successfully',
            data: {
                TotalModules,
                TotalActiveModules,
                TotalCompletedModules,
                moduleCounts,
                chartData // Include the chart data in the response
            }
        });

    } catch (error) {
        console.error("Error fetching module stats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};





exports.teamStats = async (req, res) => {
    const user = req.user;

    // Check if the user is an admin
    if (user.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    const { period } = req.query;

    try {
        // Get the company ID for the admin user
        const company = await model.company.findOne({ where: { UserId: user.id } });

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        const companyId = company.id;

        // Get total number of teams for the company
        const TotalTeams = await model.team.count({ where: { companyId } });

        // Fetch all active team IDs (teams assigned at least one task)
        const activeTeamAssignments = await model.teamTaskAssignment.findAll({
            attributes: ["teamId"],
            group: ["teamId"],
        });
        const activeTeamIds = activeTeamAssignments.map((a) => a.teamId);

        // Count active teams
        const TotalActiveTeams = await model.team.count({
            where: {
                id: {
                    [Op.in]: activeTeamIds,
                },
                companyId,
            },
        });

        // Count inactive teams
        const TotalInactiveTeams = await model.team.count({
            where: {
                id: {
                    [Op.notIn]: activeTeamIds,
                },
                companyId,
            },
        });

        // Objects for the response
        const totalCounts = [];
        const activeCounts = [];
        const inactiveCounts = [];

        // Helper function to get active team IDs within a specific period
        const getActiveTeamIdsForPeriod = async (start, end) => {
            const assignments = await model.teamTaskAssignment.findAll({
                attributes: ["teamId"],
                where: {
                    createdAt: {
                        [Op.gte]: start,
                        [Op.lte]: end,
                    },
                },
                group: ["teamId"],
            });
            return assignments.map((a) => a.teamId);
        };

        // Helper function to get team count for each period and category
        const getPeriodTeamCount = async (start, end, categoryFilter) => {
            return await model.team.count({
                where: {
                    companyId,
                    createdAt: {
                        [Op.gte]: start,
                        [Op.lte]: end,
                    },
                    ...(categoryFilter && { id: categoryFilter }),
                },
            });
        };

        if (period === "daily") {
            // Daily stats for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const dayStart = moment().subtract(i, "days").startOf("day").toDate();
                const dayEnd = moment().subtract(i, "days").endOf("day").toDate();

                const activeIdsForDay = await getActiveTeamIdsForPeriod(dayStart, dayEnd);

                const totalCount = await getPeriodTeamCount(dayStart, dayEnd);
                const activeCount = await getPeriodTeamCount(dayStart, dayEnd, { [Op.in]: activeIdsForDay });
                const inactiveCount = await getPeriodTeamCount(dayStart, dayEnd, { [Op.notIn]: activeIdsForDay });

                totalCounts.push({ name: moment(dayStart).format("ddd"), value: totalCount });
                activeCounts.push({ name: moment(dayStart).format("ddd"), value: activeCount });
                inactiveCounts.push({ name: moment(dayStart).format("ddd"), value: inactiveCount });
            }
        } else if (period === "weekly") {
            // Weekly stats for the last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = moment().subtract(i, "weeks").startOf("week").toDate();
                const weekEnd = moment().subtract(i, "weeks").endOf("week").toDate();

                const activeIdsForWeek = await getActiveTeamIdsForPeriod(weekStart, weekEnd);

                const totalCount = await getPeriodTeamCount(weekStart, weekEnd);
                const activeCount = await getPeriodTeamCount(weekStart, weekEnd, { [Op.in]: activeIdsForWeek });
                const inactiveCount = await getPeriodTeamCount(weekStart, weekEnd, { [Op.notIn]: activeIdsForWeek });

                totalCounts.push({
                    name: `${moment(weekStart).format("MMM Do")} - ${moment(weekEnd).format("MMM Do")}`,
                    value: totalCount,
                });
                activeCounts.push({
                    name: `${moment(weekStart).format("MMM Do")} - ${moment(weekEnd).format("MMM Do")}`,
                    value: activeCount,
                });
                inactiveCounts.push({
                    name: `${moment(weekStart).format("MMM Do")} - ${moment(weekEnd).format("MMM Do")}`,
                    value: inactiveCount,
                });
            }
        } else if (period === "monthly") {
            // Monthly stats for the last 12 months
            for (let i = 11; i >= 0; i--) {
                const monthStart = moment().subtract(i, "months").startOf("month").toDate();
                const monthEnd = moment().subtract(i, "months").endOf("month").toDate();

                const activeIdsForMonth = await getActiveTeamIdsForPeriod(monthStart, monthEnd);

                const totalCount = await getPeriodTeamCount(monthStart, monthEnd);
                const activeCount = await getPeriodTeamCount(monthStart, monthEnd, { [Op.in]: activeIdsForMonth });
                const inactiveCount = await getPeriodTeamCount(monthStart, monthEnd, { [Op.notIn]: activeIdsForMonth });

                totalCounts.push({ name: moment(monthStart).format("MMM"), value: totalCount });
                activeCounts.push({ name: moment(monthStart).format("MMM"), value: activeCount });
                inactiveCounts.push({ name: moment(monthStart).format("MMM"), value: inactiveCount });
            }
        } else if (period === "all") {
            // Stats for the last 10 years
            const currentYear = moment().year();
            for (let i = 9; i >= 0; i--) {
                const year = currentYear - i;
                const yearStart = moment(`${year}-01-01`).startOf("year").toDate();
                const yearEnd = moment(`${year}-12-31`).endOf("year").toDate();

                const activeIdsForYear = await getActiveTeamIdsForPeriod(yearStart, yearEnd);

                const totalCount = await getPeriodTeamCount(yearStart, yearEnd);
                const activeCount = await getPeriodTeamCount(yearStart, yearEnd, { [Op.in]: activeIdsForYear });
                const inactiveCount = await getPeriodTeamCount(yearStart, yearEnd, { [Op.notIn]: activeIdsForYear });

                totalCounts.push({ name: year.toString(), value: totalCount });
                activeCounts.push({ name: year.toString(), value: activeCount });
                inactiveCounts.push({ name: year.toString(), value: inactiveCount });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid period. Allowed values are 'daily', 'weekly', 'monthly', or 'all'.",
            });
        }

        // Return the results
        return res.status(200).json({
            success: true,
            message: "Team stats fetched successfully",
            data: {
                TotalTeams,
                TotalActiveTeams,
                TotalInactiveTeams,
                totalCounts,
                activeCounts,
                inactiveCounts,
            },
        });
    } catch (error) {
        console.error("Error fetching team stats:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch team stats",
            error: error.message,
        });
    }
};
