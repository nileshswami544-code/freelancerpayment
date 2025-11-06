CREATE DATABASE IF NOT EXISTS freelancer_db;

USE freelancer_db;

CREATE TABLE IF NOT EXISTS freelancers (
    FreelancerID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
    ClientID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    ContactInfo VARCHAR(255),
    FreelancerID INT,
    FOREIGN KEY (FreelancerID) REFERENCES freelancers(FreelancerID)
);

CREATE TABLE IF NOT EXISTS projects (
    ProjectID INT PRIMARY KEY AUTO_INCREMENT,
    ProjectName VARCHAR(255) NOT NULL,
    ClientID INT,
    FreelancerID INT,
    Status VARCHAR(50),
    DueDate DATE,
    FOREIGN KEY (ClientID) REFERENCES clients(ClientID),
    FOREIGN KEY (FreelancerID) REFERENCES freelancers(FreelancerID)
);

CREATE TABLE IF NOT EXISTS invoices (
    InvoiceID INT PRIMARY KEY AUTO_INCREMENT,
    ProjectID INT,
    Amount DECIMAL(10, 2),
    DueDate DATE,
    Status VARCHAR(50),
    FOREIGN KEY (ProjectID) REFERENCES projects(ProjectID)
);

CREATE TABLE IF NOT EXISTS payments (
    PaymentID INT PRIMARY KEY AUTO_INCREMENT,
    InvoiceID INT,
    PaymentDate DATE,
    AmountPaid DECIMAL(10, 2),
    FOREIGN KEY (InvoiceID) REFERENCES invoices(InvoiceID)
);
