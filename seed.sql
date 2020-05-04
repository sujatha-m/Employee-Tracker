USE employee_trackerDB;

INSERT INTO department (name)
VALUES ("Sales"),
("Engineering"),
("Finance"),
("Legal"),
("IT"),
("Administration");

SELECT * FROM department;


INSERT INTO roles (title, salary, department_id)
VALUES("Sales Representative",45000,1),
("Sales Manager",60000,1),
("Software Engineer",55000,2),
("Lead Engineer",65000,2),
("Software Manager",80000,2),
("Accountant",40000,3),
("Accounts Manager",55000,3),
("Lawyer",40000,4),
("Network Admin",55000,5),
("IT Manager",70000,5),
("Office Executive",30000,6),
("Human Representative",40000,6),
("Admin Manager",50000,6);

SELECT * FROM roles;

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Shashi","Mallela",5, NULL),
("Sujatha", "Mallela", 4, 1),
("Vrishank","Adya", 3, 1),
("John","Tank",2, NULL),
("Rose","Mary",1, 4),
("George","Stephen",7, NULL),
("Peter","Lu",6, 6),
("Jenny","Edward",13, NULL),
("Sophia","Washington",12, 8),
("Alex","James",8, NULL),
("Dexter","Adams",10, NULL),
("Dustin","Yang",9, 11);

SELECT * FROM employee;




