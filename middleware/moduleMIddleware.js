const fs = require('fs');
const path = require('path');
const multer = require('multer');
const model  = require('../models');

// Set up Multer storage
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            // Get user ID (this assumes you're using authentication middleware that adds `req.user`)
            const userId = req.user.id;
            let company = null;
            if(req.user.role === 'employee'){
                const employee = await model.employee.findOne({ where: { userId } });
            
                // Find the company by user ID
                company = await model.company.findOne({ where: { userId:employee.companyId } });
            }
            else{
                company = await model.company.findOne({ where: { userId } });
            }


            
            
            if (!company) {
                return cb(new Error('Company not found'), false);
            }

            // Create company folder if it doesn't exist
            const companyFolder = path.join(__dirname, '../public', company.name.toString());
            if (!fs.existsSync(companyFolder)) {
                fs.mkdirSync(companyFolder, { recursive: true });
            }

            // Create the projects folder inside the company folder if it doesn't exist
            const projectsFolder = path.join(companyFolder, 'modules');
            if (!fs.existsSync(projectsFolder)) {
                fs.mkdirSync(projectsFolder);
            }

            // Set the file destination path
            cb(null, projectsFolder);
        } catch (error) {
            cb(error, false);
        }
    },
    filename: (req, file, cb) => {
        // Use the original file name or a custom one (e.g., timestamp-based)
        const fileName = Date.now() + path.extname(file.originalname);
        cb(null, fileName);
    }
});

// Multer file filter to accept only PDF, Word, or TXT files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, Word, or TXT files are allowed'), false);
    }
};

// Initialize multer
const upload = multer({ storage, fileFilter });

// Export the upload middleware
module.exports = upload;
