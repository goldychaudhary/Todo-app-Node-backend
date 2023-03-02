const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const { format } = require("date-fns");

app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db;
const initializeDBANdServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBANdServer();

//check apis middleware
const checkValidity = (req, res, next) => {
  const { search_q, status, priority, category } = req.query;
  console.log(search_q, status, priority, category);
  invalid_field = "";
  if (
    priority !== undefined &&
    (priority !== "HIGH" || priority !== "MEDIUM" || priority !== "LOW")
  ) {
    invalid_field = "Priority";
    console.log(priority);
  }

  if (
    status !== undefined &&
    (status !== "TO DO" || status !== "IN PROGRESS" || status !== "DONE")
  ) {
    invalid_field = "Status";
    console.log(status);
  } else {
    next();
  }
  console.log(invalid_field);
};

//API 1

const statusANDpriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const categoryANDstatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const categoryANDpriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const onlyCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const onlyStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const onlyPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.get("/todos/", checkValidity, async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let getQuery = "";
  switch (true) {
    case statusANDpriority(request.query):
      getQuery = `
      SELECT
       id,todo,priority,status,category,due_date as dueDate 
      FROM
       todo 
      WHERE
       todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}'`;
      break;
    case categoryANDstatus(request.query):
      getQuery = `
      SELECT
       id,todo,priority,status,category,due_date as dueDate 
      FROM
       todo 
      WHERE
       todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND category = '${category}'`;
      break;

    case categoryANDpriority(request.query):
      getQuery = `
      SELECT
       id,todo,priority,status,category,due_date as dueDate 
      FROM
       todo 
      WHERE
       todo LIKE '%${search_q}%'
    AND priority = '${priority}'
    AND category = '${category}'`;
      break;

    case onlyCategory(request.query):
      getQuery = `
   SELECT
    id,todo,priority,status,category,due_date as dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND category = '${category}';`;
      break;

    case onlyStatus(request.query):
      getQuery = `
   SELECT
    id,todo,priority,status,category,due_date as dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;

    case onlyPriority(request.query):
      getQuery = `SELECT 
      id,todo,priority,status,category,due_date as dueDate
    FROM 
    todo 
    WHERE 
    todo LIKE '%${search_q}%'
     AND priority = '${priority}';`;
      break;
    default:
      getQuery = `SELECT 
      id,todo,priority,status,category,due_date as dueDate
       FROM todo WHERE todo LIKE "%${search_q}%"`;
      break;
  }

  const data = await db.all(getQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const getTodo = `SELECT 
  id,todo,priority,status,category,due_date as dueDate
   FROM todo WHERE id = ${todoId}`;
  const todoItem = await db.get(getTodo);
  res.send(todoItem);
});

app.get("/agenda/", async (req, res) => {
  const { date } = req.query;
  const formatedDate = format(new Date(date), "yyyy-MM-dd");
  const dbQuery = `SELECT 
  id,todo,priority,status,category,due_date as dueDate
   FROM todo WHERE due_date = "${formatedDate}"`;
  const dbResponse = await db.all(dbQuery);

  res.send(dbResponse);
});

app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  const getTodo = `
  INSERT INTO todo (id,todo,priority,status,category,due_date)
  VALUES (${id},"${todo}","${priority}","${status}","${category}","${dueDate}")`;
  await db.run(getTodo);
  res.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const previousDataQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const previousData = await db.get(previousDataQuery);

  let key = Object.keys(request.body);
  let col = key[0];
  let colName = col[0].toUpperCase() + col.slice(1);

  if (colName === "DueDate") {
    let date = colName.slice(3);
    let due = colName.slice(0, 3);
    colName = due + " " + date;
  }

  const {
    todo = previousData.todo,
    priority = previousData.priority,
    status = previousData.status,
    category = previousData.category,
    dueDate = previousData.due_date,
  } = request.body;

  const dbQuery = `UPDATE todo SET
  todo = "${todo}",
  status = "${status}",
  priority = "${priority}",
  category = "${category}",
  due_date = "${dueDate}"
  WHERE id = ${todoId};`;
  await db.run(dbQuery);
  response.send(`${colName} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dltQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(dltQuery);
  response.send("Todo Deleted");
});

module.exports = app;
