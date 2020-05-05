const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const consoletable = require('console.table');

let connection //connection object 
main()

/*
   Main function which setsup the connection to database and 
   launches the prompt for user inputs
*/
async function main() {
  let shouldContinue = true
  try {
    await connect()
    while (shouldContinue) {
      shouldContinue = await runSearch()
    }
  } catch (error) {
    console.error(error)
  } finally {
    connection.end()
  }
}

/*
   Function to establish connection with mysql server
*/
async function connect() {
  connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'employee_trackerDB'
  })
  console.log('connected as id ' + connection.threadId)
}

/*
   Function which prompts a list of desired actions for user to sslect
*/
async function promptAction() {
  return inquirer.prompt({
    name: 'action',
    type: 'rawlist',
    message: 'What Would you like to do?',
    choices: [
      "View All Employees",
      "View All Departments",
      "View All Roles",
      "View Employees by Manager",
      "View Dept TotalUtlized Budget",
      "Add Employee",
      "Add Role",
      "Add Department",
      "Update Employee Role",
      "Update Employee Manager",
      "Delete Employee",
      "Delete Role",
      "Delete Department",
      "Exit"
    ]
  })
}
// Function which calls the underlying methods to handle each of the user selected prompts
async function runSearch() {
  const answer = await promptAction()
  switch (answer.action) {
    case "View All Employees":
      return viewAllEmployees();

    case "View All Departments":
      return all_departments();

    case "View All Roles":
      return viewAllRoles();

    case "View Employees by Manager":
      return viewEmpbyMgr();

    case "View Dept TotalUtlized Budget":
      return viewBudget();

    case "Add Employee":
      return addEmployee();

    case "Add Role":
      return addRole();

    case "Add Department":
      return addDepartment();

    case "Update Employee Role":
      return updateRole();

    case "Update Employee Manager":
      return updateMgr();

    case "Delete Employee":
      return delEmployee();

    case "Delete Role":
      return delRole();

    case "Delete Department":
      return delDepartment();

    case "Exit":
      connection.end();

    default:
      return false
  };
}

//Gets all the details from employee table.
//The data is formatted to show all possible fields applicable for an employee including department info,role info and manager info 
async function viewAllEmployees() {
  try {
    const [rows] = await connection.query(`SELECT employee.id, employee.first_name, employee.last_name, roles.title, roles.department_id,
         department.name As DepartmentName, roles.salary, employee.manager_id, CONCAT(manager.first_name , ' ' , manager.last_name) AS Manager
         FROM employee INNER JOIN roles ON employee.role_id = roles.id
         LEFT JOIN employee manager ON employee.manager_id=manager.id 
         INNER JOIN department ON roles.department_id=department.id; `);
    console.table(rows)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//Displays Employee to Manager reporting list
async function viewEmpbyMgr() {
  try {
    const [list] = await connection.query(`SELECT 
    CONCAT(e.first_name, ' ', e.last_name) AS Manager,
    CONCAT(m.first_name, ' ', m.last_name) AS 'Direct report'
    FROM
    employee e
    INNER JOIN employee m ON 
       e.id = m.manager_id
    ORDER BY 
    Manager; `);
    console.table(list)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

/*
   Function that calculates the total utilized budget of a department ie the combined salaries of all employees in that department
   and displays the same
*/
async function viewBudget() {
  try {
    const dlist = await getDept(true);
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
      type: "list",
      name: "department",
      message: "Which department would you like to know Budget for?",
      choices: dlist
    }])
    const depId = await getDepId(answer.department);
    const [total] = await connection.query(`SELECT SUM(roles.salary) AS TotalUtilizedBudget
    FROM
    department
    INNER JOIN
    roles ON roles.department_id=department.id
    INNER JOIN
    employee ON employee.role_id = roles.id
    WHERE department_id=?; `, [depId]);
    console.log('Total Utilized budget is ' + total[0].TotalUtilizedBudget)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//helper function to get list of department names 
async function getDept(flag) {
  try {
    const [value] = await connection.query(`SELECT department.name FROM department`)
    if (flag) {
      return value
    } else {
      console.table(value)
      return true
    }
  } catch (err) {
    console.log(err)
    return false
  }
}

//viewing all departments in the database
async function all_departments() {
  console.log("Viewing All Departments..\n")
  return getDept(false)
}

//helper function to get list of roles from the database
async function getRoles(flag) {
  try {
    const [value] = await connection.query(`SELECT roles.title FROM roles`)
    if (flag) {
      var roles = [];
      for (var i = 0; i < value.length; i++) {
        roles.push(value[i].title);
      }
      return roles
    } else {
      console.table(value)
      return true
    }
  } catch (err) {
    console.log(err)
    return false
  }
}

//viewing all departments in the database
async function viewAllRoles() {
  console.log("Viewing All Roles..\n")
  return getRoles(false)
}

//helper function that gets the department id corresponding to a department name
async function getDepId(depName) {
  try {
    const [value] = await connection.query(`SELECT department.id
    FROM department
    WHERE department.name LIKE ?`, [depName]);
    return (value[0].id);
  } catch (err) {
    console.log(err)
    return -1
  }
}

//Function for adding New Role
async function addRole() {
  try {
    const dlist = await getDept(true);
    const rlist = await getRoles(true);
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
        type: "list",
        name: "title",
        mesage: "What is the new role?",
        choices: rlist
      },
      {
        type: "input",
        name: "salary",
        message: "How much is the salary of this role?",
      },
      {
        type: "list",
        name: "department",
        message: "What department does this role belong to?",
        choices: dlist
      }
    ])
    const depId = await getDepId(answer.department);

    //execute the insert statement
    const [role] = await connection.query(`INSERT INTO roles(title, salary, department_id)
                      VALUES(?, ?, ?)`, [answer.title, answer.salary, depId]);
    // when finished inserting into the database declare success
    console.log('Roles added successfully!');
    //console.table(role)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//helper function that gets the list of roles available in the database
async function getRoleId(roleTitle) {
  try {
    const [value] = await connection.query(`SELECT roles.id
    FROM roles
    WHERE roles.title LIKE ?`, [roleTitle]);
    return (value[0].id);
  } catch (err) {
    console.log(err)
    return -1
  }
}

//helper function that gets the list of employees from the database
async function getEmps() {
  try {
    const [rows] = await connection.query(`SELECT
            CONCAT(employee.first_name , ' ' , employee.last_name) AS Employee
            FROM employee; `);
    var emps = [];
    for (var i = 0; i < rows.length; i++) {
      emps.push(rows[i].Employee);
    }
    return emps
  } catch (err) {
    console.log(err)
  }
}

//helper function that gets the employee id corresponding to an employee's name
async function getEmpId(empName) {
  var ename = empName.split(" ");
  try {
    const [value] = await connection.query(`SELECT employee.id
    FROM employee
    WHERE employee.first_name LIKE ? AND employee.last_name LIKE ?`, [ename[0], ename[1]]);
    return (value[0].id);
  } catch (err) {
    console.log(err)
    return -1
  }
}

//Function for Updating an Employee's Manager
async function updateMgr() {
  try {
    const elist = await getEmps();
    const mlist = await getMgrs();
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
        type: "list",
        name: "emp_name",
        mesage: "Select employee name from the list",
        choices: elist
      },
      {
        type: "list",
        name: "mgr_name",
        message: "Who would be the new Manager?",
        choices: mlist
      }
    ])
    const empId = await getEmpId(answer.emp_name);
    const mgrId = await getMgrId(answer.mgr_name);


    //execute the insert statement
    const [role] = await connection.query(`UPDATE employee
                          SET employee.manager_id = ?
                          WHERE employee.id = ?`, [mgrId, empId]);
    // when finished inserting into the database declare success
    console.log('Manager updated successfully!');
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//Function for Updating an Employee Role
async function updateRole() {
  try {
    const elist = await getEmps();
    const rlist = await getRoles(true);
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
        type: "list",
        name: "emp_name",
        mesage: "Select employee name from the list",
        choices: elist
      },
      {
        type: "list",
        name: "role",
        message: "What is the new role to be updated?",
        choices: rlist
      }
    ])
    const empId = await getEmpId(answer.emp_name);
    const roleId = await getRoleId(answer.role);

    //execute the insert statement
    const [role] = await connection.query(`UPDATE employee
                          SET employee.role_id = ?
                          WHERE employee.id = ?`, [roleId, empId]);
    // when finished inserting into the database declare success
    console.log('Role updated successfully!');
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//helper function thats gets the employee id of a manager corresponding to manager's name
async function getMgrId(mgrName) {
  var mname = mgrName.split(" ");
  try {
    const [value] = await connection.query(`SELECT employee.id
    FROM employee
    WHERE employee.first_name LIKE ? AND employee.last_name LIKE ?`, [mname[0], mname[1]]);
    return (value[0].id);
  } catch (err) {
    console.log(err)
    return -1
  }
}

//helper function that  gets the list of managers from database
async function getMgrs() {
  try {
    const [rows] = await connection.query(`SELECT
            CONCAT(employee.first_name , ' ' , employee.last_name) AS Manager
            FROM employee
            INNER JOIN roles ON employee.role_id = roles.id
            INNER JOIN department ON roles.department_id=department.id
            WHERE roles.title LIKE '%Manager'; `);
    var mgrs = [];
    for (var i = 0; i < rows.length; i++) {
      mgrs.push(rows[i].Manager);
    }
    return mgrs
  } catch (err) {
    console.log(err)
  }
}

//Function for adding Employee
async function addEmployee() {
  try {
    const rlist = await getRoles(true);
    var mlist = await getMgrs();
    mlist.push('No Manager');
    // prompt for getting the department name from user
    const answer = await inquirer.prompt([{
        type: "input",
        name: "first_name",
        mesage: "What is the employee first name?"
      },
      {
        type: "input",
        name: "last_name",
        message: "What is the employee last name?",
      },
      {
        type: "list",
        name: "role",
        message: "What is the employee's role?",
        choices: rlist
      },
      {
        type: "list",
        name: "managerID",
        message: "Who's the employee's manager?",
        choices: mlist
      }
    ])
    var mgrId;
    if (answer.managerID === 'No Manager') {
      mgrId = null;
    } else {
      mgrId = await getMgrId(answer.managerID);
    }
    const roleId = await getRoleId(answer.role);
    //execute the insert statement
    const [Employee] = await connection.query(`INSERT INTO employee(first_name, last_name, role_id, manager_id)
                      VALUES(?, ?, ?, ?)`, [answer.first_name, answer.last_name, roleId, mgrId]);
    // when finished inserting into the database declare success
    console.log('Employees added successfully!');
    //console.table(Employee)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//Function for adding department
async function addDepartment() {
  try {
    // prompt for getting the department name from user
    const answer = await inquirer.prompt([{
      type: "list",
      name: "Department",
      message: "What department would you like to add?",
      choices: ['Sales', 'Engineering', 'Finance', 'Legal', 'IT', 'Administration', 'R&D', 'Marketing'],
    }, ])
    //execute the insert statement
    const [departments] = await connection.query(`INSERT INTO department(name)
                      VALUES(?)`, [answer.Department]);
    // when finished inserting into the database declare success
    console.log('Department ' + answer.Department + ' added successfully!');
    //console.table(departments)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//Function for deleting department
async function delDepartment() {
  try {
    const dlist = await getDept(true);
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
      type: "list",
      name: "department",
      message: "Which department would you like to delete?",
      choices: dlist
    }])
    const depId = await getDepId(answer.department);
    const [status] = await connection.query(`DELETE FROM department
    WHERE department.id=?; `, [depId]);
    console.log('Department ' + answer.department + ' deleted successfully!');
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//Function for deleting employee
async function delEmployee() {
  try {
    const elist = await getEmps();
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
      type: "list",
      name: "emp_name",
      message: "Which employee would you like to delete?",
      choices: elist
    }])
    const empId = await getEmpId(answer.emp_name);
    const [status] = await connection.query(`DELETE FROM employee
    WHERE employee.id=?; `, [empId]);
    console.log('Employee ' + answer.emp_name + ' deleted successfully!');
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

//Function for deleting Role
async function delRole() {
  try {
    const rlist = await getRoles(true);
    // prompt for getting the new role,salary from user
    const answer = await inquirer.prompt([{
      type: "list",
      name: "role",
      message: "Which role would you like to delete?",
      choices: rlist
    }])
    const roleId = await getRoleId(answer.role);
    const [total] = await connection.query(`DELETE FROM roles
    WHERE roles.id=?; `, [roleId]);
    console.log('Role ' + answer.role + ' deleted successfully!');
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}