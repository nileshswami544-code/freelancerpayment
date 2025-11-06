require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Freelancer Signup
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }
        db.query('INSERT INTO freelancers (Username, Password) VALUES (?, ?)', [username, hash], (err, result) => {
            if (err) {
                return res.status(500).send('Error creating freelancer');
            }
            res.status(201).send('Freelancer created successfully');
        });
    });
});

// Freelancer Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM freelancers WHERE Username = ?', [username], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }
        const freelancer = results[0];
        bcrypt.compare(password, freelancer.Password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).send('Invalid username or password');
            }
            const token = jwt.sign({ id: freelancer.FreelancerID }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        });
    });
});


// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Clients CRUD
app.get('/api/clients', authenticateToken, (req, res) => {
    db.query('SELECT * FROM clients WHERE FreelancerID = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching clients');
        }
        res.json(results);
    });
});

app.post('/api/clients', authenticateToken, (req, res) => {
    const { Name, ContactInfo } = req.body;
    db.query('INSERT INTO clients (Name, ContactInfo, FreelancerID) VALUES (?, ?, ?)', [Name, ContactInfo, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send('Error creating client');
        }
        res.status(201).send('Client created successfully');
    });
});

app.put('/api/clients/:id', authenticateToken, (req, res) => {
    const { Name, ContactInfo } = req.body;
    db.query('UPDATE clients SET Name = ?, ContactInfo = ? WHERE ClientID = ? AND FreelancerID = ?', [Name, ContactInfo, req.params.id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send('Error updating client');
        }
        res.send('Client updated successfully');
    });
});

app.delete('/api/clients/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM clients WHERE ClientID = ? AND FreelancerID = ?', [req.params.id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send('Error deleting client');
        }
        res.send('Client deleted successfully');
    });
});


// Projects CRUD
app.get('/api/projects', authenticateToken, (req, res) => {
    db.query('SELECT * FROM projects WHERE FreelancerID = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching projects');
        }
        res.json(results);
    });
});

app.post('/api/projects', authenticateToken, (req, res) => {
    const { ProjectName, ClientID, Status, DueDate } = req.body;
    db.query('INSERT INTO projects (ProjectName, ClientID, FreelancerID, Status, DueDate) VALUES (?, ?, ?, ?, ?)', [ProjectName, ClientID, req.user.id, Status, DueDate], (err, result) => {
        if (err) {
            return res.status(500).send('Error creating project');
        }
        res.status(201).send('Project created successfully');
    });
});

app.put('/api/projects/:id', authenticateToken, (req, res) => {
    const { ProjectName, ClientID, Status, DueDate } = req.body;
    db.query('UPDATE projects SET ProjectName = ?, ClientID = ?, Status = ?, DueDate = ? WHERE ProjectID = ? AND FreelancerID = ?', [ProjectName, ClientID, Status, DueDate, req.params.id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send('Error updating project');
        }
        res.send('Project updated successfully');
    });
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM projects WHERE ProjectID = ? AND FreelancerID = ?', [req.params.id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send('Error deleting project');
        }
        res.send('Project deleted successfully');
    });
});


// Invoices CRUD
app.get('/api/invoices', authenticateToken, (req, res) => {
    db.query('SELECT * FROM invoices JOIN projects ON invoices.ProjectID = projects.ProjectID WHERE projects.FreelancerID = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching invoices');
        }
        res.json(results);
    });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
    const { ProjectID, Amount, DueDate, Status } = req.body;
    db.query('INSERT INTO invoices (ProjectID, Amount, DueDate, Status) VALUES (?, ?, ?, ?)', [ProjectID, Amount, DueDate, Status], (err, result) => {
        if (err) {
            return res.status(500).send('Error creating invoice');
        }
        res.status(201).send('Invoice created successfully');
    });
});

app.put('/api/invoices/:id', authenticateToken, (req, res) => {
    const { ProjectID, Amount, DueDate, Status } = req.body;
    db.query(
        'UPDATE invoices i JOIN projects p ON i.ProjectID = p.ProjectID SET i.ProjectID = ?, i.Amount = ?, i.DueDate = ?, i.Status = ? WHERE i.InvoiceID = ? AND p.FreelancerID = ?',
        [ProjectID, Amount, DueDate, Status, req.params.id, req.user.id],
        (err, result) => {
            if (err) {
                return res.status(500).send('Error updating invoice');
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Invoice not found or not owned by user');
            }
            res.send('Invoice updated successfully');
        }
    );
});

app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
    db.query(
        'DELETE i FROM invoices i JOIN projects p ON i.ProjectID = p.ProjectID WHERE i.InvoiceID = ? AND p.FreelancerID = ?',
        [req.params.id, req.user.id],
        (err, result) => {
            if (err) {
                return res.status(500).send('Error deleting invoice');
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Invoice not found or not owned by user');
            }
            res.send('Invoice deleted successfully');
        }
    );
});


// Payments CRUD
app.get('/api/payments', authenticateToken, (req, res) => {
    db.query('SELECT * FROM payments JOIN invoices ON payments.InvoiceID = invoices.InvoiceID JOIN projects ON invoices.ProjectID = projects.ProjectID WHERE projects.FreelancerID = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching payments');
        }
        res.json(results);
    });
});

app.post('/api/payments', authenticateToken, (req, res) => {
    const { InvoiceID, PaymentDate, AmountPaid } = req.body;
    db.query(
        'SELECT ProjectID FROM invoices JOIN projects ON invoices.ProjectID = projects.ProjectID WHERE invoices.InvoiceID = ? AND projects.FreelancerID = ?',
        [InvoiceID, req.user.id],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).send('Forbidden: Invoice does not belong to this freelancer');
            }
            db.query('INSERT INTO payments (InvoiceID, PaymentDate, AmountPaid) VALUES (?, ?, ?)', [InvoiceID, PaymentDate, AmountPaid], (err, result) => {
                if (err) {
                    return res.status(500).send('Error creating payment');
                }
                res.status(201).send('Payment created successfully');
            });
        }
    );
});


// Reports
app.get('/api/reports/total-payments', authenticateToken, (req, res) => {
    db.query('SELECT SUM(AmountPaid) AS TotalPayments FROM payments JOIN invoices ON payments.InvoiceID = invoices.InvoiceID JOIN projects ON invoices.ProjectID = projects.ProjectID WHERE projects.FreelancerID = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching total payments');
        }
        res.json(results[0]);
    });
});

app.get('/api/reports/pending-invoices', authenticateToken, (req, res) => {
    db.query('SELECT COUNT(*) AS PendingInvoices FROM invoices JOIN projects ON invoices.ProjectID = projects.ProjectID WHERE projects.FreelancerID = ? AND invoices.Status = ?', [req.user.id, 'pending'], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching pending invoices');
        }
        res.json(results[0]);
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
