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


usernames = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
tasks = [
    {
        title: "Task 1",
        notes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        owner: "User1",
        completeness: "Incomplete"
    },
    {
        title: "Task 2",
        notes: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        owner: "User2",
        completeness: "Complete"
    },
    {
        title: "Task 3",
        notes: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        owner: "User3",
        completeness: "Incomplete"
    },
];

app.set('view engine', 'ejs');
app.use(express.static('public'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    if (req.session.username) {
        // If a user is logged in, render the home page
        res.render('home', { usernames: usernames, tasks: tasks });
    } else {
        // If no user is logged in, render the index page
        res.render('index', { usernames: usernames });
    }
});

app.get('/add', (req, res) => {
    res.render('add', { usernames: usernames });
});

app.post('/login', (req, res) => {
    console.log(req.body);
    const username = req.body.username;

    if (!username) {
        res.status(400).send('Please select a valid username.');
    } else {
        req.session.username = username;
        res.render('home', { usernames: usernames, tasks: tasks})
    }
});

app.post('/adduser', (req, res) => {
    const newUsername = req.body.textbox;

    if (!usernames.includes(newUsername)) {
        usernames.push(newUsername);
        console.log(`Added new user: ${newUsername}`);
        res.redirect('/');
    } else {
        res.status(400).send('Username already exists.');
    }
});


app.get('/logout', (req, res) => {
    // Destroy the session when the user logs out
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});


app.post('/updateTask', (req, res) => {
    const title = req.body.title;
    const notes = req.body.notes;
    const owner = req.body.owner;
    const completeness = req.body.completeness;

    // Find the task that matches the specified title, notes, and owner
    const matchedTaskIndex = tasks.findIndex(task => task.title === title && task.notes === notes && task.owner === owner);

    if (matchedTaskIndex !== -1) {
        // Update the completeness of the matched task
        tasks[matchedTaskIndex].completeness = completeness;
        console.log(`Updated completeness of task '${title}' to ${completeness}`);
        res.sendStatus(200);
    } else {
        res.status(400).send('Task not found.');
    }
});

app.post('/deleteTask', (req, res) => {
    const title = req.body.title;
    const notes = req.body.notes;
    const owner = req.body.owner;

    // Find the task that matches the specified title, notes, and owner
    const matchedTaskIndex = tasks.findIndex(task => task.title === title && task.notes === notes && task.owner === owner);

    if (matchedTaskIndex !== -1) {
        // Delete the matched task
        tasks.splice(matchedTaskIndex, 1);
        console.log(`Deleted task '${title}'`);
        res.sendStatus(200);
    } else {
        res.status(400).send('Task not found.');
    }
});

app.post('/addtask', (req, res) => {
    const title = req.body.textbox;
    const notes = req.body.notes;
    const owner = req.body.owner;

    if (!title || !notes || !owner) {
        res.status(400).send('All fields are required.');
        return;
    }

    const isDuplicate = tasks.some(task =>
        task.title === title && task.notes === notes && task.owner === owner
    );

    if (isDuplicate) {
        res.status(400).send('Duplicate task.');
        return;
    }


    tasks.push({
        title: title,
        notes: notes,
        owner: owner,
        completeness: "Incomplete" 
    });

    res.redirect('/');
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
