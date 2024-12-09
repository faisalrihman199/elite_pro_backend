module.exports = {
    host: 'localhost',
    username: 'root',
    password: '',
    database: 'emp_backend',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 150,
      min: 0,
      acquire: 30000000,
      idle: 10000,
    },
  };
  