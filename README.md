# Postcrossing System: Backend API & Firefox Extension

This project is a comprehensive midterm submission that fulfills the requirements of designing and implementing a system inspired by Postcrossing. It consists of two distinct but related components:

1.  **A Backend System:** A fully functional API built with Node.js, Express, and MongoDB that simulates the core logic of Postcrossing, including user management and a fair, reciprocal postcard exchange algorithm.
2.  **A Firefox Browser Extension:** A practical tool that interacts with the real Postcrossing website to sort open postcard tabs numerically.

---

## Features

### Backend API (`postcrossing_api`)
-   **RESTful API Design:** Clean, logical endpoints for managing users and postcards.
-   **MongoDB Schema:** A well-designed NoSQL schema to efficiently store data for users, postcards, and addresses.
-   **User Management:** Basic user registration and profile retrieval.
-   **Fair Reciprocal Logic:** The core feature implements a complex algorithm using a MongoDB Aggregation Pipeline to ensure the user who has sent the most cards without receiving one is prioritized to get the next postcard. This goes beyond simple random assignment to create a truly fair system.

### Firefox Extension (`postcrossing_sorter`)
-   **Live Tab Sorting:** Sorts all open `postcrossing.com/postcards/...` tabs in the current window with a single click.
-   **Numerical Sorting:** Correctly parses the postcard ID from the URL (e.g., `CL-34269`) and sorts tabs in ascending numerical order.
-   **Simple UI:** A clean browser action button in the Firefox toolbar for instant activation.

---

## Technology Stack

-   **Backend:**
    -   **Runtime:** Node.js
    -   **Framework:** Express.js
    -   **Database:** MongoDB with MongoDB Compass (for GUI)
    -   **ODM/Driver:** `mongodb` (Official Node.js Driver)
-   **Browser Extension:**
    -   **Language:** JavaScript
    -   **APIs:** WebExtensions API (for Firefox)
-   **API Testing:**
    -   Thunder Client (VS Code Extension) or Postman

---

## Project Structure
.
├── .gitignore # Ignores the node_modules folder
├── postcrossing_api/
│ ├── package.json
│ └── server.js # The core backend application logic
│
└── postcrossing_sorter/
├── icons/
│ └── icon.png # Icon for the browser extension
├── background.js # The extension's sorting logic
└── manifest.json # The extension's configuration file

---

## Setup and Installation Guide

To get this project running, you need to set up the backend and the browser extension separately.

### Prerequisites
-   [Node.js](https://nodejs.org/en/) (LTS version recommended)
-   [MongoDB Community Server](https://www.mongodb.com/try/download/community)
-   [MongoDB Compass](https://www.mongodb.com/products/compass) (Highly recommended for viewing the database)
-   [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/)
-   An API Client like [Thunder Client](https://www.thunderclient.com/) (VS Code) or [Postman](https://www.postman.com/downloads/).

### Part 1: Backend API Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd postcrossing-midterm-project
    ```
2.  **Navigate to the API Directory:**
    ```bash
    cd postcrossing_api
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Ensure MongoDB is Running:** Make sure your MongoDB service has started. You can verify this by opening MongoDB Compass and connecting to the default address (`mongodb://localhost:27017`).
5.  **Run the Server:**
    ```bash
    node server.js
    ```
    Upon success, the terminal will display:
    ```
    Server running at http://localhost:3000
    Successfully connected to MongoDB!
    ```

### Part 2: Firefox Extension Setup

1.  **Open Firefox.**
2.  Navigate to the debugging page by typing `about:debugging` in the address bar.
3.  Click on **"This Firefox"** in the left-hand menu.
4.  Click the **"Load Temporary Add-on..."** button.
5.  Navigate inside the project folder to `postcrossing_sorter/` and select the **`manifest.json`** file.
6.  The extension is now loaded, and its icon will appear in the Firefox toolbar.

---

## How to Test and Verify Execution

### Testing the Backend API

Use an API client like Thunder Client to test the endpoints.

1.  **Register User 1:**
    -   **Method:** `POST`
    -   **URL:** `http://localhost:3000/api/users/register`
    -   **Body (JSON):** `{ "username": "user_one", "email": "one@test.com", "country": "USA" }`
    -   **Expected Result:** A `201 Created` response with the new user's ID.

2.  **Register User 2:**
    -   **Method:** `POST`
    -   **URL:** `http://localhost:3000/api/users/register`
    -   **Body (JSON):** `{ "username": "user_two", "email": "two@test.com", "country": "Germany" }`
    -   **Expected Result:** A `201 Created` response.

3.  **Request an Address:**
    -   **Method:** `POST`
    -   **URL:** `http://localhost:3000/api/postcards/request-address`
    -   **Body (JSON):** `{ "senderId": "[PASTE_THE_ID_OF_USER_ONE_HERE]" }`
    -   **Expected Result:** A `200 OK` response assigning User Two as the recipient. You can verify in MongoDB Compass that a new document has been created in the `postcards` collection.

### Testing the Firefox Extension

1.  In Firefox, open the following URLs in any random order:
    -   `https://www.postcrossing.com/postcards/CN-4087990`
    -   `https://www.postcrossing.com/postcards/US-11797804`
    -   `https://www.postcrossing.com/postcards/CL-34269`
2.  Observe the random order of the tabs.
3.  **Click the extension icon** in your Firefox toolbar.
4.  **Expected Result:** The tabs will instantly re-order themselves to be `CL-34269`, followed by `CN-4087990`, and finally `US-11797804`.
