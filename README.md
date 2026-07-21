# Foodee - Food Ordering Website

Foodee is an online food ordering system with a customer-facing website, an admin panel, a Node.js backend, and a MySQL database.

## Project Features

- Customer can browse menu items
- Customer can add food to cart
- Customer can login or register with name, phone number, and email
- Customer can place an order and see confirmation
- Admin has a separate login and organized dashboard
- Admin can manage orders, customers, food items, analytics, and messages
- Menu data is stored in MySQL database

## Technology Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- MySQL

## Folder Structure

```text
assets/      Images, icons, and brand files
css/         Website styling and responsive design
database/    Database schema and seed SQL files
html/        Extra website pages
js/          Frontend JavaScript
server/      Node.js backend and database connection
index.html   Home page
package.json Backend package and run scripts
```

## Database

Database name:

```text
foodee_db
```

Main tables:

```text
categories    Food categories
products      Menu products
customers     Customer name, phone, and email
admin_users   Admin login account
orders        Order and bill information
order_items   Ordered food details
contacts      Contact form messages
cart_events   Add-to-cart activity
```

## Easy Way To Run

1. Start MySQL Server 8.0.
2. Double-click `start-foodee-server.bat`.
3. Keep the black server window open.
4. The customer website opens automatically at `http://127.0.0.1:5600/`.

## Admin Login

Open the normal Login window on the website and choose **Admin Login**.

```text
Username: admin
Password: admin123
```

The admin dashboard includes Dashboard, Customer Orders, Customers, Menu Management, Analytics, Messages, and Database Tables.

## Command Line Way

1. Start MySQL Server 8.0.
2. Create a `.env` file using `.env.example`.
3. Install dependencies:

```bash
npm install
```

4. Create database tables:

```bash
npm run db:migrate
```

5. Insert menu data:

```bash
npm run db:seed
```

6. Start the server:

```bash
npm start
```

Website link:

```text
http://127.0.0.1:5600
```

Direct admin page (redirects to Admin Login when logged out):

```text
http://127.0.0.1:5600/html/admin.html
```

## Presentation Summary

This project uses HTML, CSS, and JavaScript for the frontend. The backend is built with Node.js and Express.js. MySQL is used as the database. Customer orders are saved through backend API routes into MySQL tables. The admin panel fetches saved data from the backend and shows customer, order, product, contact, and revenue details.
