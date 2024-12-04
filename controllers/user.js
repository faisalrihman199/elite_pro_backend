const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const model = require("../models");
const { sendEmail } = require("../config/nodemailer");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");

require("dotenv").config();
exports.addCompany = async (req, res) => {
  const { email } = req.body;

  // Input validations
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    // Generate OTP using speakeasy
    const otp = speakeasy.totp({
      secret: email, // It's better to use a unique OTP secret, not email
      encoding: "base32",
    });

    // Log email to confirm value
    console.log("Sending email to:", email);
    // Send OTP to user's email
    const mailOptions = {
      to: email, // Ensure email is defined and correct
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    // Log email to confirm value
    console.log("Sending email to:", email);

    await sendEmail(mailOptions);

    // Respond with success
    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error sending email: ", error); // Log error for further investigation
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the company.",
      error: error.message,
    });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, password, name, address, phone, website, otp } = req.body;
  // Hash the password for security
  const hashedPassword = await bcrypt.hash(password, 10);

  // Verify OTP using speakeasy
  const isValidOtp = speakeasy.totp.verify({
    secret: email, // Same secret used during OTP generation
    encoding: "base32",
    token: otp,
    window: 1,
  });

  if (isValidOtp) {
    const existingUser = await model.user.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }
    const user = await model.user.create({
      email,
      password: hashedPassword,
      role: "admin",
    });
    await model.company.create({
      name,
      address,
      phone,
      website,
      email,
      userId: user.id,
    });
    res.json({ success: true, message: "User registered successfully" });
  } else {
    res.json({ success: false, message: "Invalid OTP" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required fields.",
    });
  }

  try {
    // Check if a user with the given email exists
    const user = await model.user.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please check your email and try again.",
      });
    }

    let name;
    if (user.role === "admin") {
      console.log("inside if");
      const company = await model.company.findOne({
        where: { UserId: user.id },
      });
      console.log("company is ", company);
      name = company.name;
    } else if (user.role === "employee") {
      const employee = await model.employee.findOne({
        where: { UserId: user.id },
      });
      name = `${employee.firstName} ${employee.lastName}`;
    }

    console.log("name is ", name);

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d", // Token expires in 1 hour
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred during login.",
      error: error.message,
    });
  }
};

exports.sendEmpOtp = async (req, res) => {
  const { email } = req.body;

  // Input validations
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email, password, name, and address are required fields.",
    });
  }

  try {
    // Check if a user with the same email already exists
    const existingUser = await model.user.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use. Please choose a different email.",
      });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP using speakeasy
    const otp = speakeasy.totp({
      secret: email, // It's better to use a unique OTP secret, not email
      encoding: "base32",
    });

    // Log email to confirm value
    console.log("Sending email to:", email);
    // Send OTP to user's email
    const mailOptions = {
      to: email, // Ensure email is defined and correct
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    // Log email to confirm value
    console.log("Sending email to:", email);

    await sendEmail(mailOptions);

    // Respond with success
    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error sending email: ", error); // Log error for further investigation
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the company.",
      error: error.message,
    });
  }
};

exports.verifyEmployeeOTP = async (req, res) => {
  const {
    email,
    password,
    full_name,
    address,
    phone,
    designation,
    department,
    otp,
    companyId,
  } = req.body;
  // Hash the password for security
  const hashedPassword = await bcrypt.hash(password, 10);

  // Verify OTP using speakeasy
  const isValidOtp = speakeasy.totp.verify({
    secret: email, // Same secret used during OTP generation
    encoding: "base32",
    token: otp,
    window: 1,
  });

  if (isValidOtp) {
    const existingUser = await model.user.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const user = await model.user.create({
      email,
      password: hashedPassword,
      role: "employee",
    });
    await model.employee.create({
      full_name,
      address,
      phone,
      designation,
      department,
      userId: user.id,
      companyId,
    });
    res.json({ success: true, message: "User registered successfully" });
  } else {
    res.json({ success: false, message: "Invalid OTP" });
  }
};

exports.companyAddEmployee = async (req, res) => {
  try {
    const authUser = req.user;

    // Check if the authenticated user has admin privileges
    if (authUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    // Find the company associated with the admin user
    const company = await model.company.findOne({
      where: { userId: authUser.id },
    });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Extract data from request body
    const {
      email,
      password,
      firstName,
      lastName,
      address,
      phone,
      designation,
      department,
      cnic,
    } = req.body;

    // Check if required fields are provided
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !address ||
      !phone ||
      !cnic
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: email, password, full_name, address, phone, cnic",
      });
    }

    // Check if a user with the same email already exists
    const existingUser = await model.user.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Check if the CNIC is already in use
    const existingCnic = await model.employee.findOne({ where: { cnic } });
    if (existingCnic) {
      return res.status(409).json({
        success: false,
        message: "CNIC already exists",
      });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle the uploaded profile image (if provided)
    let profileImagePath = null;
    if (req.file) {
      // Get the relative path (exclude `public/` part)
      const filePath = req.file.path; // This is the full path to the file
      profileImagePath = path.relative(
        path.join(__dirname, "../public"),
        filePath
      ); // Excludes `public/` and saves the relative path
    }

    // Create a new user with role "employee"
    const newUser = await model.user.create({
      email,
      password: hashedPassword,
      role: "employee",
    });

    // Create a new employee record
    await model.employee.create({
      userId: newUser.id, // Foreign key linking to the user
      firstName,
      lastName,
      address,
      phone,
      designation,
      department,
      cnic,
      profile_image: profileImagePath, // Save the relative path to the database
      companyId: company.id, // Foreign key linking to the company
    });

    // Respond with success message
    res.status(201).json({
      success: true,
      message: "Employee added successfully",
    });
  } catch (error) {
    console.error("Error adding employee: ", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the employee",
      error: error.message,
    });
  }
};

exports.addProjectForCompany = async (req, res) => {
  const {
    name,
    description,
    budget,
    startDate,
    endDate,
    clientName,
    clientEmail,
  } = req.body;
  const userId = req.user.id;

  // Check if the requirements file is present in the form-data
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Requirements file is required.",
    });
  }

  // Get the company by user ID
  const company = await model.company.findOne({ where: { userId } });
  if (!company) {
    return res.status(404).json({
      success: false,
      message: "Company not found.",
    });
  }

  const companyId = company.id;
  const companyName = company.name; // Get company name

  // Input validation
  if (
    !name ||
    !description ||
    !budget ||
    !startDate ||
    !endDate ||
    !clientName ||
    !clientEmail
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required except requirements file.",
    });
  }

  try {
    // Create the full path to save the file in the folder
    const requirementsFilePath = path.join(
      __dirname,
      "../uploads",
      companyName,
      "projects",
      req.file.filename
    );

    // Ensure the directory exists or create it
    const dirPath = path.join(__dirname, "../uploads", companyName, "projects");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 3. Create the project with the relative path for requirements (starting from the company name)
    const requirementsRelativePath = path.join(
      "/",
      companyName,
      "projects",
      req.file.filename
    ); // This is the relative path

    const newProject = await model.project.create({
      name,
      description,
      budget,
      requirements: requirementsRelativePath, // Save the relative path in the requirements field
      startDate,
      endDate,
      clientName,
      clientEmail,
      companyId,
    });

    // 5. Respond with success message
    res.status(201).json({
      success: true,
      message: "Project added successfully.",
      data: newProject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the project.",
      error: error.message,
    });
  }
};

exports.addOrUpdateProjectEmployee = async (req, res) => {
  const authUser = req.user;
  const {
    projectId,
    employeeId,
    roleInProject,
    hoursAllocated,
    status,
  } = req.body;

  if (authUser.role !== "admin") {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to perform this action.",
    });
  }

  // Input validation
  if (!projectId || !employeeId || !roleInProject || !hoursAllocated) {
    return res.status(400).json({
      success: false,
      message:
        "Project ID, Employee ID, Role in Project, and Hours Allocated are required.",
    });
  }

  try {
    // 1. Find the company associated with the authenticated user
    const company = await model.company.findOne({
      where: { userId: authUser.id },
    });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found for the authenticated user.",
      });
    }

    // 2. Check if the project belongs to the authenticated user's company
    const project = await model.project.findOne({
      where: { id: projectId, companyId: company.id },
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or does not belong to your company.",
      });
    }

    // 3. Check if the employee belongs to the same company
    const employee = await model.employee.findOne({
      where: { id: employeeId, companyId: company.id },
    });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to your company.",
      });
    }

    // 4. Check if the employee is already assigned to the project
    const existingAssignment = await model.projectEmployee.findOne({
      where: { projectId, employeeId },
    });

    // If an assignment already exists, update it
    if (existingAssignment) {
      const updatedAssignment = await existingAssignment.update({
        roleInProject,
        hoursAllocated,
        status,
      });

      return res.status(200).json({
        success: true,
        message: "Employee project assignment updated successfully.",
        data: updatedAssignment,
      });
    }

    // If no existing assignment, create a new one
    const newAssignment = await model.projectEmployee.create({
      projectId,
      employeeId,
      roleInProject,
      hoursAllocated,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Employee assigned to project successfully.",
      data: newAssignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while assigning/updating the employee.",
      error: error.message,
    });
  }
};

exports.getAllEmployeesForCompany = async (req, res) => {
  const authUser = req.user;
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and 10 items per page

  // If limit is "all", return all records without pagination
  if (limit === "all") {
    try {
      // 1. Find the company associated with the authenticated user
      const company = await model.company.findOne({
        where: { userId: authUser.id },
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found for the authenticated user.",
        });
      }

      // 2. Fetch all employees for the company without pagination
      const employees = await model.employee.findAll({
        where: { companyId: company.id },
      });

      // 3. Send the response with all employees data
      res.status(200).json({
        success: true,
        message: "Employees fetched successfully.",
        data: {
          employees,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the employees.",
        error: error.message,
      });
    }
  } else {
    // Proceed with paginated approach if limit is not "all"
    const pageNumber = parseInt(page);
    const pageSizeNumber = parseInt(limit);

    // Input validation for pagination parameters
    if (
      isNaN(pageNumber) ||
      pageNumber <= 0 ||
      isNaN(pageSizeNumber) ||
      pageSizeNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page and pageSize must be positive integers.",
      });
    }

    try {
      // 1. Find the company associated with the authenticated user
      const company = await model.company.findOne({
        where: { userId: authUser.id },
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found for the authenticated user.",
        });
      }

      // 2. Fetch employees for the company with pagination
      const employees = await model.employee.findAndCountAll({
        where: { companyId: company.id },
        limit: pageSizeNumber,
        offset: (pageNumber - 1) * pageSizeNumber, // Calculate offset based on the page number
      });

      // 3. Send the response with paginated data
      res.status(200).json({
        success: true,
        message: "Employees fetched successfully.",
        data: {
          employees: employees.rows,
          totalItems: employees.count, // Total number of employees in the company
          totalPages: Math.ceil(employees.count / pageSizeNumber), // Total pages
          currentPage: pageNumber, // Current page
          pageSize: pageSizeNumber, // Number of items per page
        }, // The employees data
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching the employees.",
        error: error.message,
      });
    }
  }
};

exports.getAllProjectsWithEmployees = async (req, res) => {
  const authUser = req.user;
  const { page = 1, limit = 10 } = req.query; // Get page and limit from query params (default to page 1 and limit 10)

  try {
    // 1. Find the company associated with the authenticated user
    const company = await model.company.findOne({
      where: { userId: authUser.id },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found for the authenticated user.",
      });
    }

    // 2. Fetch the total count of projects for pagination metadata
    const totalProjects = await model.project.count({
      where: { companyId: company.id },
    });

    // 3. Fetch the paginated projects for the company with their associated employees
    const projects = await model.project.findAll({
      where: { companyId: company.id },
      include: {
        model: model.employee,
        through: {
          model: model.projectEmployee,
          attributes: ["roleInProject", "hoursAllocated", "status"],
        },
        as: "employees",
      },
      limit: parseInt(limit), // Set limit for pagination
      offset: (parseInt(page) - 1) * parseInt(limit), // Calculate the offset based on page and limit
    });

    // 4. Map through the projects to include employees and their details
    const projectData = projects.map((project) => {
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate,
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        employees: project.employees.map((employee) => ({
          id: employee.id,
          full_name: employee.full_name,
          roleInProject: employee.projectEmployee.roleInProject,
          hoursAllocated: employee.projectEmployee.hoursAllocated,
          status: employee.projectEmployee.status,
        })),
      };
    });

    // 5. Return the response with pagination metadata
    res.status(200).json({
      success: true,
      message: "Projects fetched successfully.",
      data: {
        totalProjects,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProjects / parseInt(limit)),
        pageSize: parseInt(limit),
        projects: projectData,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the projects and employees.",
      error: error.message,
    });
  }
};

exports.addTaskToProject = async (req, res) => {
  const authUser = req.user; // Authenticated user from middleware
  const {
    name,
    description,
    status,
    startDate,
    endDate,
    projectId,
    teamId,
  } = req.body;

  try {
    const status1 = status || "active";

    // Validate team existence
    const team = await model.team.findOne({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    // Validate project existence and ownership
    const existingProject = await model.project.findOne({
      where: { id: projectId },
      include: {
        model: model.company,
        where: { userId: authUser.id }, // Ensure the project belongs to the authenticated user's company
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have access to this project.",
      });
    }

    // Check if a task with the same name already exists for the project
    const existingTask = await model.task.findOne({
      where: {
        name,
        projectId,
      },
    });

    if (existingTask) {
      return res.status(409).json({
        success: false,
        message: "A task with this name already exists for this project.",
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Task name is required.",
      });
    }

    // Handle file upload (if any)
    let detailsFilePath = null;
    if (req.file) {
      detailsFilePath = req.file.path.replace(
        path.join(__dirname, "../public"),
        ""
      );
    }

    // Create the task and associate it with the project
    const newTask = await model.task.create(
      {
        name,
        description,
        status: status1,
        startDate,
        endDate,
        projectId,
        detailsFile: detailsFilePath,
      },
      { raw: true }
    );

    // Associate task with the team
    await model.teamTaskAssignment.create({ teamId, taskId: newTask.id });

    // Create group chat for the task and team
    const groupChat = await model.groupChat.create({
      name: `${name} - ${team.name}`,
    });

    // Retrieve team members with their associated user emails
    const teamMemberships = await model.teamMembership.findAll({
      where: { teamId }, // Filter by the specific team ID
      attributes: ["employeeId"], // Retrieve employeeId from the teamMembership table
      include: [
        {
          model: model.employee, // Join with the Employee model
          include: [
            {
              model: model.user, // Join with the User model to fetch the email
              attributes: ["email"], // Retrieve email from the User model
            },
          ],
        },
      ],
    });

    const employees = teamMemberships.map((membership) => ({
      employeeId: membership.employeeId,
      userId: membership.employee.userId,
      email: membership.employee.user.email, // Email is retrieved from the User model
    }));

    // Prepare group chat memberships and notifications
    const memberships = employees.map(({ employeeId }) => ({
      groupChatId: groupChat.id,
      employeeId,
    }));

    const notifications = employees.map(({ userId }) => ({
      notificationType: "group_chat",
      content: `You have been added to the group chat for the task: ${name}`,
      userId,
    }));

    // Bulk create group chat memberships and notifications
    await model.groupChatMembership.bulkCreate(memberships);
    await model.notification.bulkCreate(notifications);
    newTask.teamId = teamId;
    // Respond immediately
    res.status(201).json({
      success: true,
      message: "Task added successfully to the project.",
      data: {
        task: newTask,
        teamId,
      },
    });

    // Send emails asynchronously after the response
    const emailPromises = employees.map(({ email }) =>
      sendEmail({
        to: email,
        subject: `You have been added to a new task: ${name}`,
        text: `Hello,\n\nYou have been assigned to the task "${name}" as part of the project "${existingProject.name}".\n\nPlease check the details in your account.\n\nBest regards,\nTeam`,
      })
    );

    Promise.all(emailPromises)
      .then(() => console.log("Emails sent successfully."))
      .catch((err) => console.error("Error sending emails:", err));
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the task.",
      error: error.message,
    });
  }
};

exports.getOneTask = async (req, res) => {
  const user = req.user;
  const taskId = req.query.taskId;

  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: "Task ID is required.",
    });
  }

  try {
    // Fetch the task and ensure it belongs to the user's company
    let task = await model.task.findOne({
      where: { id: taskId },
      include: {
        model: model.team,
        attributes: { exclude: ["createdAt", "updatedAt"] },
      },
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have access to this task.",
      });
    }

    task = task.get({ plain: true });

    // Fetch all modules associated with the task
    const modules = await model.modules.findAll({
      where: { taskId },
    });

    task.modules = modules;

    if (modules.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Task retrieved successfully.",
        data: {
          task,

          taskProgressPercentage: 0, // No modules, progress is 0%
        },
      });
    }

    // Calculate task progress percentage
    const completedModules = modules.filter(
      (module) => module.completionPercentage === "100"
    ).length;
    const taskProgressPercentage = (completedModules / modules.length) * 100;
    task.progress = taskProgressPercentage;
    // Respond with the task, modules, and progress percentage
    res.status(200).json({
      success: true,
      message: "Task retrieved successfully.",
      data: {
        task,
      },
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the task.",
      error: error.message,
    });
  }
};

exports.assignOrUpdateEmployeeToTask = async (req, res) => {
  const { employeeId, taskId, roleInTask, hoursAllocated, status } = req.body;
  const authUser = req.user;

  // Check if user is an admin
  if (authUser.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to perform this action.",
    });
  }

  // Input validation
  if (!employeeId || !taskId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID and Task ID are required.",
    });
  }

  try {
    // Check if the task exists
    const task = await model.task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Check if the employee exists
    const employee = await model.employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Check if the employee is already assigned to the task
    const existingAssignment = await model.employeeTask.findOne({
      where: { employeeId, taskId },
    });

    // If the employee is already assigned to the task, update the assignment
    if (existingAssignment) {
      const updatedAssignment = await existingAssignment.update({
        roleInTask,
        hoursAllocated,
        status,
      });

      return res.status(200).json({
        success: true,
        message: "Employee task assignment updated successfully.",
        assignment: updatedAssignment,
      });
    }

    // If no existing assignment, create a new one
    const newAssignment = await model.employeeTask.create({
      employeeId,
      taskId,
      roleInTask,
      hoursAllocated,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Employee assigned to task successfully.",
      assignment: newAssignment,
    });
  } catch (error) {
    console.error("Error assigning or updating employee to task:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while assigning or updating the employee task.",
      error: error.message,
    });
  }
};

exports.getOneProject = async (req, res) => {
  const user = req.user;
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required.",
    });
  }

  try {
    // Fetch the project and ensure it belongs to the authenticated user's company
    let project = await model.project.findOne({
      where: { id: projectId },
      // include: {
      //     model: model.company,
      //     where: { userId: user.id } , attributes: [] // Ensure the project belongs to the authenticated user's company
      // }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have access to this project.",
      });
    }

    // Fetch all tasks associated with the project
    let tasks = await model.task.findAll({
        where: { projectId },
        attributes: ["id", "name", "status"], // Add other task fields if needed
        include: [
          {
            model: model.modules,
            include: {
              model: model.employee,
            },
          },
          {
            model: model.team,
            include: {
              model: model.employee,
              as: 'employees',  // Ensure this matches the alias in your association
            },
          },
        ],
      });
   
   
    


    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Project retrieved successfully.",
        data: {
          project,
          tasks: [],
          projectProgressPercentage: 0, // No tasks, progress is 0%
        },
      });
    }

    // Calculate the project's progress percentage based on tasks
    let totalTaskProgress = 0;
    const taskProgresses = [];
    tasks.forEach((task) => {
      if (task.modules.length > 0) {
        // Calculate the task progress percentage
        const completedModules = task.modules.filter(
          (module) => module.completionPercentage == 100
        ).length;
        const taskProgress = (completedModules / task.modules.length) * 100;
        taskProgresses.push({ taskId: task.id, progress: taskProgress });
        totalTaskProgress += taskProgress;
      }
    });

    const projectProgressPercentage = totalTaskProgress / tasks.length;

    project = project.get({ plain: true }); // Convert the Sequelize instance to a plain object
    project.progress = Math.round(projectProgressPercentage);
    let teams = [];
    for (let index = 0; index < tasks.length; index++) {
      tasks[index] = tasks[index].get({ plain: true });
      tasks[index].progress = taskProgresses[index].progress;
      teams.push(tasks[index].Teams[0]);
    }
   
    project.tasks = tasks;
    project.teams = teams;

    // Respond with the project, tasks, and progress percentage
    res.status(200).json({
      success: true,
      message: "Project retrieved successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the project.",
      error: error.message,
    });
  }
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  // Generate OTP using speakeasy
  const user = await model.user.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please check your email and try again.",
    });
  }
  const otp = speakeasy.totp({
    secret: email, // It's better to use a unique OTP secret, not email
    encoding: "base32",
  });

  const mailOptions = {
    to: email, // Ensure email is defined and correct
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. `,
  };

  // Log email to confirm value
  console.log("Sending email to:", email);

  await sendEmail(mailOptions);

  return res.status(200).json({
    success: true,
    message: "OTP has been sent to your email address.",
  });
};

exports.verifyForget = async (req, res) => {
  const { email, otp, password } = req.body;
  // Hash the password for security

  const hashedPassword = await bcrypt.hash(password, 10);
  // Verify OTP using speakeasy
  const isValidOtp = speakeasy.totp.verify({
    secret: email, // Same secret used during OTP generation
    encoding: "base32",
    token: otp,
    window: 1,
  });

  if (isValidOtp) {
    await model.user.update({ password: hashedPassword }, { where: { email } });
    res.json({ success: true, message: "password changed successfully" });
  } else {
    res.json({ success: false, message: "Invalid OTP" });
  }
};

exports.addModuleForTask = async (req, res) => {
  console.log("inside add module:", req);

  const {
    moduleId,
    name,
    description,
    status,
    startDate,
    endDate,
    taskId,
    employeeId,
  } = req.body;
  const file = req.file; // Handle the single uploaded file

  console.log("body is", req.body);
  console.log("name is", name);
  console.log("taskId is", taskId);

  if (!taskId || !name) {
    return res.status(400).json({
      success: false,
      message: "Task ID and Module name are required.",
    });
  }

  // Utility function to get the relative path for the file
  const getRelativePath = (filePath) => filePath.split("public")[1]; // Extract the part after "public"

  try {
    // If moduleId is provided, update the module
    if (moduleId) {
      // Check if the module exists for the given task
      const existingModule = await model.modules.findOne({
        where: {
          id: moduleId,
          taskId: taskId, // Ensure the module belongs to the correct task
        },
      });

      if (!existingModule) {
        return res.status(404).json({
          success: false,
          message: "Module not found for this task.",
        });
      }

      // Update the requirementFile if the file is provided
      if (file) {
        existingModule.requirementFile = getRelativePath(file.path);
      }

      // Update other fields
      const updatedModule = await existingModule.update({
        name,
        description,
        status,
        startDate,
        endDate,
      });

      const existingMembership = await model.employeeModuleAssignment.findOne({
        where: { moduleId },
      });
      if (existingMembership && existingMembership.employeeId !== employeeId) {
        await existingMembership.update({ employeeId });
      }

      return res.status(200).json({
        success: true,
        message: "Module updated successfully.",
        module: updatedModule,
      });
    }

    // If moduleId is not provided, create a new module for the task
    const newModule = await model.modules.create({
      taskId,
      name,
      description,
      status,
      startDate,
      endDate,
    });

    // Save the requirementFile if the file is provided
    if (file) {
      newModule.requirementFile = getRelativePath(file.path);
      await newModule.save(); // Save the updated file path
    }

    // Create the employee-module assignment
    const moduleEmployee = await model.employeeModuleAssignment.create({
      moduleId: newModule.id,
      employeeId,
    });

    res.status(201).json({
      success: true,
      message: "Module created successfully.",
      module: newModule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding/updating the module.",
      error: error.message,
    });
  }
};
