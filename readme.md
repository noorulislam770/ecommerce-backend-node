# eCommerce Backend with Node.js

## Description
This project is a backend solution for an eCommerce platform, built with Node.js, Express, and MySQL.  
It provides APIs for user authentication, product management, cart functionality, and order processing.  
A minimal frontend was also added for testing core functionalities, including managing products, cart, and orders.

---

## Features
1. **Authentication and Authorization**:
   - JWT-based user authentication.
   - Role-based access control for customers and admins.

2. **Product Management**:
   - CRUD operations for products.
   - Admin-only access.

3. **Cart and Orders**:
   - Add, update, and remove items from the cart.
   - Place and manage orders.

4. **Error Handling and Logging**:
   - Centralized error handling middleware.
   - Application event logging using Winston.

5. **Frontend Integration** (Basic):
   - Basic EJS views for testing core functionalities.

---

## Prerequisites
- **Node.js** >= 14.x
- **MySQL Database**
- **npm**

---

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/noorulislam770/ecommerce-backend-node.git
   cd ecommerce-backend-node


## Install dependencies:

```bash
Copy code
npm install
Set up the .env file:
```
## env
```bash
Copy code
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce
JWT_SECRET=rockpapersiccors
JWT_EXPIRES_IN=1d
```
```bash
Copy code
npm run migrate
Start the server:
```
```bash
Copy code
npm start
```
## Usage
# API Endpoints:

- /auth/register: Register a user.
- /auth/login: Login and get a JWT token.
- /products: Manage products.
- /cart: Manage cart items.
- /orders: Place and manage orders.
- Admin Dashboard:

Access the admin panel at /admin/dashboard (requires admin role).
## Code Structure
- routes/: Contains route files for API endpoints.
- middleware/: Middleware for authentication, authorization, and error handling.
- views/: EJS templates for frontend views.
- utils/: Utility functions, including logging setup.
- config/: Configuration for the database and environment variables.
## License
- This project is licensed under the MIT License.
