//design pattern
//readable, maintainable, debuggable
//MVC/MVVM, model(data) view(element) controller(eventlistener, logic), model view viewmodel
//template(html), controller(javascript),css(), DOM api(window.document),

//closure, IIFE(immediately invoked function expression)

/* const model = (() => {
    let counter = 0;
    const increment = () => {
        counter++
        return counter
    };
    return {
        increment,
    };
})();

console.log(model.increment());
console.log(model.increment()); */

//table, rows, columns, id(uuid(universally unique identifier), uid)

/* 

    get(id optionally): read
    post: write
    put(id): update, replace
    patch(id): update, partial replace
    delete(id): remove a row
*/

const APIs = (() => {
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodo) => {
        // post
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const removeTodo = (id) => {
        return fetch(URL + `/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };

    const updateTodo = (id, newTodo) => {
        return fetch(
            URL + `/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(newTodo),
                headers: { "Content-Type": "application/json" },
            }
        ).then((res) => res.json());
    }
    
    return {
        addTodo,
        removeTodo,
        getTodos,
        updateTodo,
    };
})();

const Model = (() => {
    //todolist
    class State {
        #todos; //[{id: ,title: },{}]
        #editId=0;    // 当前正在被编辑的todoId
        #onChange;
        editContent=""; // 当前被编辑的内容
        constructor() {
            this.#todos = [];
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            console.log("setter");
            this.#todos = newTodo;
            //const obj = {name:"adam"}; 
            //obj.age //undefined 
            //obj.age(); //error
            this.#onChange?.();
        }

        get editId() {
            return this.#editId;
        }

        set editId(newEditId) {
            this.#editId = parseInt(newEditId);
            this.#onChange();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }
    let { getTodos, removeTodo, addTodo, updateTodo } = APIs;

    return {
        State,
        getTodos,
        removeTodo,
        addTodo,
        updateTodo
    };
})();
//BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form"); //querying
    const todoListEl = document.querySelector(".todo-list");
    const updateTodoList = (todos) => {
        console.log('updateTodoList');
        let template = "";
        todos.forEach((todo) => {
            const todoContentToShow = `<span class="${todo.completed ? 'todo-content-completed todo-content' : 'todo-content'}" id="${todo.id}" todo='${JSON.stringify(todo)}'>${todo.title}</span>`;
            const todoContentToEdit = `<input class="input-edit" value="${todo.title}" />`
            const isEditingCurTodo = todo.id === ViewModel.state.editId;

            const todoTemplate = `<li>
                    ${isEditingCurTodo ? todoContentToEdit : todoContentToShow}
                    <div class="btn-box">
                        <button class="btn-edit" id="${todo.id}" todo='${JSON.stringify(todo)}'>
                            ${isEditingCurTodo ? 'ok' : 'edit'}
                        </button>
                        <button class="btn-delete" id="${todo.id}">
                            remove
                        </button>
                    </div>
                </li>`;
            template += todoTemplate;
        });
        if(todos.length === 0){
            template = "no task to display"
        }
        todoListEl.innerHTML = template;
    };

    return {
        formEl,
        todoListEl,
        updateTodoList,
    };
})();

//reference: pointer
//window.console.log

//

/* 
    prevent the refresh
    get the value from input
    save the new task to the database(could fail)
    save new task object to state, update the page
    

*/

const ViewModel = ((View, Model) => {
    console.log("model", Model);
    const state = new Model.State();

    const getTodos = () => {
        Model.getTodos().then((res) => {
            state.todos = res;
        });
    };

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const title = event.target[0].value;
            if(title.trim() === "") {
                alert("please input title!");
                return;
            }
            console.log("title", title);
            const newTodo = { title, completed: false };
            Model.addTodo(newTodo)
                .then((res) => {
                    // state.todos = [res, ...state.todos];
                    getTodos();
                    event.target[0].value = ""
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        //event bubbling: event listener from parent element can receive event emitted from its child
        View.todoListEl.addEventListener("click",(event)=>{
            //console.log(event.target/* emit the event */, event.currentTarget/* receive the event */);
            const id = event.target.id;
            //console.log("id", id)
            if(event.target.className === "btn-delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })
    };

    const editTodo = () => {
        View.todoListEl.addEventListener(
            "click",
            (event) => {
                const id = event.target.id;
                const todo = JSON.parse(event.target.getAttribute('todo'));

                if (event.target.className === 'btn-edit') {
                    if (state.editId === 0) {
                        state.editId = id;
                    } else {
                        if (state.editId === parseInt(id)) {
                            const editInput = document.getElementsByClassName('input-edit')[0];
                            Model.updateTodo(id, { ...todo, title: editInput.value })
                            .then(res=>{
                                getTodos();
                                state.editId = 0;
                            })
                            .catch(err=>alert(`update todo failed: ${err}`))
                        } else {
                            state.editId = id;
                        }
                    }
                }
            }

        )
    }

    const completeTodo = () => {
        View.todoListEl.addEventListener(
            'click',
            (event) => {
                const id = event.target.id;
                const todo = JSON.parse(event.target.getAttribute('todo'));
                console.log(todo);
                if (event.target.classList.contains('todo-content')) {
                    Model.updateTodo(id, { ...todo, completed: !todo.completed })
                    .then(res=>{
                        getTodos();
                        state.editId = 0;
                    })
                    .catch(err=>alert(`complete todo failed: ${err}`))
                }
            }
        )
    }

    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        editTodo();
        completeTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
        state,
    };
})(View, Model);

ViewModel.bootstrap();
