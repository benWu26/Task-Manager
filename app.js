const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const PORT = 3000; 

app.use(session({
    secret: 'asdf', 
    resave: false,
    saveUninitialized: true
}));

var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: '????'
});
var base = Airtable.base('');

app.set('view engine', 'ejs');
app.use(express.static('public'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', async (req, res) => {
    try {
        const records = await getUserData();
        const tasks = await getTasksById(req.session.username)
        if (req.session.username) {
            res.render('home', { records: records, tasks: tasks });
        } else {
            res.render('index', { records : records });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/add', async (req, res) => {
    const usernames = await getUsernames();
    res.render('add', { usernames: usernames });
});

app.post('/login', async (req, res) => {
    const username = req.body.username;
    var records;
    try {
        records = await getUserData();
    } catch (error) {
        console.error(error);
    }

    var tasks;
    try {
        tasks = await getTasksById(username);
    } catch (error) {
        console.error(error);
    }
    
    if (!username) {
        res.status(400).send('Please select a valid username.');
    } else {
        req.session.username = username;
        res.render('home', { records: records, tasks: tasks})
    }
});

app.post('/adduser', async (req, res) => {
    const newUsername = req.body.textbox;
    var usernames;
    try {
        usernames = await getUsernames();
    } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
    }
    if (!usernames.includes(newUsername)) {
        createUserWithTasks(newUsername);
        console.log(`Added new user: ${newUsername}`);
        res.redirect('/');
    } else {
        res.status(400).send('Username already exists.');
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});


app.post('/updateTask', (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const notes = req.body.notes;
    const status = req.body.status; 

    console.log("id", id, "name", name, "notes", notes, "status", status);
    updateTask(id, name, notes, status, req.session.username);

    res.sendStatus(200);
});

app.post('/deleteTask', (req, res) => {
    const id = req.body.id;
    deleteTaskById(id);
    res.redirect('/');
});

app.post('/addtask', (req, res) => {
    const title = req.body.textbox;
    const notes = req.body.notes;
    const owner = req.body.owner;

    if (!title || !notes || !owner) {
        res.status(400).send('All fields are required.');
        return;
    }

    createTask(title, notes, owner);

    res.redirect('/');
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});





/* all backend functions */


function getUsernames() {
    return new Promise((resolve, reject) => {
        const usernames = [];

        base('Users').select({
            view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
            records.forEach(function (record) {
                usernames.push(record.get('Name'));
            });

            fetchNextPage();

        }, function done(err) {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve(usernames);
        });
    });
}


function createUserWithTasks(name) {
    base('Users').create([
        {
            "fields": {
                "Name": name,
                "Tasks": []
            }
        }
    ], function (err, records) {
        if (err) {
            console.error(err);
            return;
        }
        records.forEach(function (record) {
            console.log(record.getId());
        });
    });
}

function getUserData() {
    return new Promise((resolve, reject) => {
        const users = [];

        base('Users').select({
            view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
            records.forEach(function (record) {
                users.push({
                    id: record.id,
                    name: record.get('Name'),
                    tasks: record.get('Tasks')
                });
            });

            fetchNextPage();

        }, function done(err) {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve(users);
        });
    });
}

function getTasksById(id) {
    return new Promise((resolve, reject) => {
        const tasks = [];

        base('Tasks').select({
            view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
            records.forEach(function (record) {
                const users = record.get('User');
                if (users && users.includes(id)) { 
                    const task = {
                        id: record.id,
                        notes: record.get('Notes'),
                        name: record.get('Name'),
                        status: record.get('Status'),
                        user: record.get('User')
                    };
                    tasks.push(task);
                }
            });

            fetchNextPage();

        }, function done(err) {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve(tasks);
        });
    });
}

function createTask(name, notes, user) {
    base('Tasks').create([
        {
            "fields": {
                "Name": name,
                "Notes": notes,
                "Status": "Todo",
                "User": [user]
            }
        }
    ], function (err, records) {
        if (err) {
            console.error(err);
            return;
        }
        records.forEach(function (record) {
            console.log(record.getId());
        });
    });
}

function deleteTaskById(taskId) {
    base('Tasks').destroy(taskId, function (err, deletedRecords) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Deleted', deletedRecords.length, 'records');
    });
}

function updateTask(id, name, notes, status, user) {
    base('Tasks').update([
        {
            "id": id,
            "fields": {
                "Name": name,
                "Notes": notes,
                "Status": status,
                "User": [user]
            }
        }
    ], function (err, records) {
        if (err) {
            console.error(err);
            return;
        }
        records.forEach(function (record) {
            console.log(record.get('Name'));
        });
    });
}
