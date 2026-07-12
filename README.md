# Foodee - Food Ordering Website

Foodee is a university project for an online food ordering system. The project has a customer-facing website, an admin panel, a Node.js backend, and a MySQL database.

## Project Features

- Customer can browse menu items
- Customer can add food to cart
- Customer can login with name and phone number before order
- Customer can place an order and see confirmation
- Admin can see orders, customers, cart activity, contact messages, products, and revenue
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
customers     Customer name and phone
orders        Order and bill information
order_items   Ordered food details
contacts      Contact form messages
cart_events   Add-to-cart activity
```

## How To Run

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

Admin page:

```text
http://127.0.0.1:5600/html/admin.html
```

## Presentation Summary

This project uses HTML, CSS, and JavaScript for the frontend. The backend is built with Node.js and Express.js. MySQL is used as the database. Customer orders are saved through backend API routes into MySQL tables. The admin panel fetches saved data from the backend and shows customer, order, product, contact, and revenue details.
