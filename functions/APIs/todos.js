// require database from admin directory
const { request } = require('express');
const { db } = require('../util/admin');

// get all todo items
exports.getAllTodos = (request, response) => {
    db
        .collection('todos')
        .where('username', '==', request.user.username)
        .orderBy('deadline')
        .get()
        .then((data) => {
            let todos = [];
            data.forEach((doc) => {
                todos.push({
                    todoId: doc.id,
                    title: doc.data().title,
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    deadline: new Date(doc.data().deadline) //return a readable string
                });
            });
            return response.json(todos);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code});
        });
};

// method that add new todo
exports.postOneTodo = (request, response) => {
    if (request.body.body.trim() === '') {
        return response.status(400).json({ body: 'Must not be empty' });
    }

    if (request.body.title.trim() === '') {
        return response.status(400).json({ title: 'Must not be empty' });
    }

    const newTodoItem = {
        title: request.body.title,
        body: request.body.body,
        createdAt: new Date().toISOString(),
        deadline: new Date(request.body.deadline).getTime(),
        username: request.user.username
    }

    db.collection('todos')
      .add(newTodoItem)
      .then((doc) => {
          const responseTodoItem = newTodoItem;
          responseTodoItem.id = doc.id;
          return response.json(responseTodoItem);
      })
      .catch((err) => {
          response.status(500).json({ error: 'Something went wrong' });
          console.error(err);
      });
};


// method that delete todo
exports.deleteTodo = (request, response) => {
    const document = db.doc(`/todos/${request.params.todoId}`);
    document.get()
            .then((doc) => {
                if (!doc.exists) {
                    return response.status(404).json({ error: 'Todo not found' })
                }
                if (doc.data().username !== request.user.username) {
                    return response.status(403).json({ error: "UnAuthorized" })
                }
                return document.delete();
            })
            .then(() => {
                response.json({ message: 'Delete Successfully!' });
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ error: err.code });
            });
};

// method that edit todo
exports.editTodo = ( request, response ) => { 
    if(request.body.todoId || request.body.createdAt){
        response.status(403).json({message: 'Not allowed to edit'});
    }

    const newTodoItem = {
        title: request.body.title,
        body: request.body.body,
        deadline: new Date(request.body.deadline).getTime() // return a timestamp
    }

    let document = db.collection('todos').doc(`${request.params.todoId}`);
    document.update(newTodoItem)
            .then(()=> {
                response.json({message: 'Updated successfully'});
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ 
                        error: err.code 
                });
            });
};
