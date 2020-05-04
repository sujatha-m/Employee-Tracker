DROP DATABASE IF EXISTS employee_trackerDB;
CREATE database employee_trackerDB;

USE employee_trackerDB;

CREATE TABLE department (
  id INTEGER AUTO_INCREMENT,
  name VARCHAR(30) NULL,
  PRIMARY KEY (id)
);

CREATE TABLE roles (
  id INTEGER AUTO_INCREMENT,
  title VARCHAR(30) NULL,
  salary DECIMAL(10,2) NULL,
  department_id INTEGER,
  PRIMARY KEY (id),
  FOREIGN KEY (department_id) 
  REFERENCES department(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL
);

CREATE TABLE employee (
  id INTEGER AUTO_INCREMENT,
  first_name VARCHAR(30) NULL,
  last_name VARCHAR(30) NULL,
  role_id INTEGER,
  manager_id INTEGER,
  PRIMARY KEY (id),
 FOREIGN KEY (role_id) 
 REFERENCES roles(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL,
 FOREIGN KEY (manager_id) 
REFERENCES employee(id)
     ON UPDATE CASCADE
      ON DELETE SET NULL
);