document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const navLinks = document.querySelectorAll('nav a');

    let token = localStorage.getItem('token');

    if (token) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        loadSection('dashboard');
    }

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    signupBtn.addEventListener('click', async () => {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            alert('Signup successful! Please login.');
            showLogin.click();
        } else {
            alert('Error signing up');
        }
    });

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            loadSection('dashboard');
        } else {
            alert('Invalid username or password');
        }
    });

    logoutBtn.addEventListener('click', () => {
        token = null;
        localStorage.removeItem('token');
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            loadSection(sectionId);
        });
    });

    async function loadSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';

        if (!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };

        if (sectionId === 'dashboard') {
            // Implement dashboard data loading
        } else if (sectionId === 'clients') {
            const response = await fetch('/api/clients', { headers });
            const clients = await response.json();
            const clientsSection = document.getElementById('clients');
            clientsSection.innerHTML = '<h2>Clients</h2>';
            clients.forEach(client => {
                const clientDiv = document.createElement('div');
                clientDiv.innerHTML = `<p>${client.Name} - ${client.ContactInfo}</p>`;
                clientsSection.appendChild(clientDiv);
            });
        } else if (sectionId === 'projects') {
            const response = await fetch('/api/projects', { headers });
            const projects = await response.json();
            const projectsSection = document.getElementById('projects');
            projectsSection.innerHTML = '<h2>Projects</h2>';
            projects.forEach(project => {
                const projectDiv = document.createElement('div');
                projectDiv.innerHTML = `<p>${project.ProjectName} - ${project.Status}</p>`;
                projectsSection.appendChild(projectDiv);
            });
        } else if (sectionId === 'invoices') {
            const response = await fetch('/api/invoices', { headers });
            const invoices = await response.json();
            const invoicesSection = document.getElementById('invoices');
            invoicesSection.innerHTML = '<h2>Invoices</h2>';
            invoices.forEach(invoice => {
                const invoiceDiv = document.createElement('div');
                invoiceDiv.innerHTML = `<p>Invoice #${invoice.InvoiceID} - Amount: ${invoice.Amount}</p>`;
                invoicesSection.appendChild(invoiceDiv);
            });
        } else if (sectionId === 'payments') {
            const response = await fetch('/api/payments', { headers });
            const payments = await response.json();
            const paymentsSection = document.getElementById('payments');
            paymentsSection.innerHTML = '<h2>Payments</h2>';
            payments.forEach(payment => {
                const paymentDiv = document.createElement('div');
                paymentDiv.innerHTML = `<p>Payment for Invoice #${payment.InvoiceID} - Amount: ${payment.AmountPaid}</p>`;
                paymentsSection.appendChild(paymentDiv);
            });
        } else if (sectionId === 'reports') {
            const totalPaymentsResponse = await fetch('/api/reports/total-payments', { headers });
            const totalPayments = await totalPaymentsResponse.json();
            const pendingInvoicesResponse = await fetch('/api/reports/pending-invoices', { headers });
            const pendingInvoices = await pendingInvoicesResponse.json();
            const reportsSection = document.getElementById('reports');
            reportsSection.innerHTML = `
                <h2>Reports</h2>
                <p>Total Payments: ${totalPayments.TotalPayments}</p>
                <p>Pending Invoices: ${pendingInvoices.PendingInvoices}</p>
            `;
        }
    }
});
