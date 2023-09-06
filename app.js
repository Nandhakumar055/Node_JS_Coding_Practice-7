const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

app.use(express.json());

let DB = null;

const initializationServerAndDb = async () => {
  try {
    DB = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (err) {
    console.log(`DB ERROR: ${err.message}`);
    process.exit(1);
  }
};

initializationServerAndDb();

const priorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const categoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const categoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const searchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// API - 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case priorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                SELECT * FROM todo WHERE status = '${status}' and priority = '${priority}';`;
          data = await DB.all(getTodoQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case categoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                SELECT * FROM todo WHERE status = '${status}' and category = '${category}';`;
          data = await DB.all(getTodoQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case priorityAndCategoryProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodoQuery = `
                SELECT * FROM todo WHERE category = '${category}' and priority = '${priority}';`;
          data = await DB.all(getTodoQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case priorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
            SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await DB.all(getTodoQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case categoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
            SELECT * FROM todo WHERE category = '${category}';`;
        data = await DB.all(getTodoQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case statusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
            SELECT * FROM todo WHERE status = '${status}';`;
        data = await DB.all(getTodoQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        console.log(status);
      }
      break;

    case searchProperty(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await DB.all(getTodoQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));

      break;

    default:
      getTodoQuery = `select * from todo;`;
      data = await DB.all(getTodoQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

//API - 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `select * from todo where id = ${todoId};`;
  const responseResult = await DB.get(getToDoQuery);
  response.send(outPutResult(responseResult));
});

//API - 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `select * from todo where due_date = '${newDate}';`;
    const responseResult = await DB.all(getDateQuery);

    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API - 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                  INSERT INTO
                  todo(id, todo, priority, status,  category, due_date)
                  VALUES
                  (${id}, '${todo}', '${priority}', '${status}', '${category}','${postNewDate}');`;
          await DB.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API - 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { priority, todo, status, dueDate, category } = request.body;

  let updateTodoQuery = null;

  switch (true) {
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
            UPDATE
            todo
            SET
            status ='${status}'
            WHERE
            id = ${todoId};`;

        await DB.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
            UPDATE
            todo
            SET
            priority ='${priority}'
            WHERE
            id = ${todoId};`;

        await DB.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
            todo
            SET
            todo ='${todo}'
            WHERE
            id = ${todoId};`;

      await DB.run(updateTodoQuery);
      response.send("Todo Updated");

      break;

    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateCategoryQuery = `
            UPDATE
            todo
            SET
            category ='${category}'
            WHERE
            id = ${todoId};`;

        await DB.run(updateCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        updateDateQuery = `
            UPDATE
            todo
            SET
            status ='${dueDate}'
            WHERE
            id = ${todoId};`;

        await DB.run(updateDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

// API - 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    delete from todo where id = ${todoId};`;

  await DB.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
