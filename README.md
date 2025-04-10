# Event Booking Application

## Objective

Implement a full-stack web application that allows authenticated users to view and book pre-defined event time slots available in a weekly calendar view. The displayed slots are filtered based on the user's saved category preferences.

## Technologies Used

*   **Backend:**
    *   Python 3.x
    *   Django
    *   Django REST Framework (DRF)
    *   dj-rest-auth (for Token Authentication, Registration)
    *   django-allauth (dependency for dj-rest-auth registration)
    *   SQLite (for development database)
*   **Frontend:**
    *   React (with Vite)
    *   JavaScript
    *   Material UI (MUI)
    *   react-router-dom (for routing)
    *   axios (for API requests)
    *   react-big-calendar (for calendar display)
    *   date-fns (for date utilities)
    *   Vitest (for testing)
    *   React Testing Library (for testing)
    *   MSW (Mock Service Worker for API mocking in tests)
*   **Development:**
    *   Node.js & npm
    *   Python Virtual Environment (`venv`)
    *   pytest, pytest-django, pytest-cov (for backend testing)

## Features

*   **User Authentication:** Secure user login/logout using username and password via API tokens.
*   **User Registration:** ~~Users can sign up with a username and password.~~ Work in progress.
*   **User Preferences:**
    *   Users can view available event categories.
    *   Users can select/deselect categories they are interested in.
    *   Preferences are saved to the user's profile on the backend.
*   **Calendar View:**
    *   Displays events/time slots in a weekly view.
    *   Allows navigation to previous/next weeks.
    *   **Filtering:** Automatically displays only the time slots belonging to the categories saved in the user's preferences.
*   **Booking:**
    *   Displays available slots clearly.
    *   Provides a "Sign Up" button on available slots.
    *   Shows a confirmation modal before booking.
    *   Updates the calendar view upon successful booking.
*   **Unbooking:**
    *   Displays slots booked by the current user distinctly.
    *   Provides an "Unsubscribe" button on the user's own booked slots.
    *   Shows a confirmation modal before unbooking.
    *   Updates the calendar view upon successful unbooking.
*   **UI:**
    *   Responsive two-column layout (Preferences | Calendar).
    *   Application header with logo, welcome message, and logout button.

## Getting Started / Development Environment Setup

### Prerequisites

*   Python 3.8+ and `pip`
*   Node.js and `npm`
*   Git (for cloning the repository)

### Backend Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/jakubawieruk/cognizant-full-stack
    cd cognizant-full-stack
    ```
2.  **Navigate to Backend Directory:**
    ```bash
    cd backend
    ```
3.  **Create and Activate Virtual Environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```
4.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    # Or if no requirements.txt: pip install Django djangorestframework dj-rest-auth django-allauth djangocorsheaders pytest pytest-django pytest-cov psycopg2-binary (or other DB driver if not using SQLite)
    ```
5.  **Apply Migrations:**
   
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```
6.  **Create Superuser (for Admin access):**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to set username, password (email is optional).
7.  **(Optional) Create Initial Data:** For testing, use the Django Admin to create initial `Category` and `TimeSlot` objects:
    *   Run the backend server (see step below).
    *   Go to `http://localhost:8000/admin/`.
    *   Log in with your superuser credentials.
    *   Navigate to "Api" -> "Categories" and add a few.
    *   Navigate to "Api" -> "Time slots" and add a few for upcoming dates, assigning them categories.

### Frontend Setup

1.  **Navigate to Frontend Directory:**
    From the project root directory:
    ```bash
    cd ../frontend
    ```
2.  **Install Node Dependencies:**
    ```bash
    npm install
    ```

### Running the Application

You need to run both the backend and frontend servers concurrently in separate terminals.

1.  **Run Backend Server:**
    *   Navigate to the `backend` directory.
    *   Ensure your virtual environment is activated.
    *   Run:
        ```bash
        python manage.py runserver
        ```
    *   The Django API will typically be available at `http://localhost:8000`.

2.  **Run Frontend Server:**
    *   Navigate to the `frontend` directory.
    *   Run:
        ```bash
        npm run dev
        ```
    *   The React application will typically be available at `http://localhost:5173` (or another port specified by Vite). Open this URL in your browser.

## Testing

### Backend Tests

1.  Navigate to the `backend` directory.
2.  Ensure your virtual environment is activated.
3.  Run pytest:
    ```bash
    pytest
    ```
4.  To view coverage:
    ```bash
    pytest --cov=api # Show coverage for the 'api' app
    # or generate HTML report
    pytest --cov=api --cov-report=html
    # Then open htmlcov/index.html
    ```

### Frontend Tests

1.  Navigate to the `frontend` directory.
2.  Run Vitest:
    ```bash
    npm test
    ```
3.  To run with UI (optional):
    ```bash
    npm run test:ui
    ```
4.  To view coverage:
    ```bash
    npm run coverage
    ```

## Manual Testing Guide

1.  **Ensure App is Running:** Start both backend and frontend servers.
2.  **Access Frontend:** Open `http://localhost:5173` (or the Vite port) in your browser. You should be redirected to the login page.
3.  **Login:**
    *   Log in using superuser credentials.
    *   Verify you are redirected to the main layout (Preferences | Calendar).
    *   Verify the header shows "Welcome, [your_username]!" and a "Sign Out" button.
4.  **User Preferences:**
    *   Locate the "User Preferences" card on the left.
    *   Verify it loads and displays the Categories created via the admin.
    *   Check/uncheck category checkboxes. The calendar view on the right should update **instantly** to show/hide timeslots belonging to those categories.
    *   Click "Save Changes". Verify a success message appears briefly. (Saved preferences will be used the next time you load the page).
5.  **Calendar View:**
    *   Verify the calendar displays the current week by default.
    *   Use the "<" and ">" buttons in the header to navigate to previous/next weeks. Verify the timeslots update for the displayed week.
    *   Verify that only timeslots matching your *currently selected* preferences (checkboxes) are shown. Change preferences and confirm the calendar updates.
6.  **Booking:**
    *   Ensure at least one category is selected in Preferences for which an *available* timeslot exists in the current/navigated week.
    *   Find an available timeslot (should have a "Sign Up" button).
    *   Click "Sign Up".
    *   A confirmation modal should appear. Click "Confirm".
    *   Verify the modal closes, a success message appears briefly, and the booked slot now appears differently (e.g., different color/text, "Unsubscribe" button).
7.  **Unbooking:**
    *   Find a timeslot that *you* just booked (should have an "Unsubscribe" button).
    *   Click "Unsubscribe".
    *   A confirmation modal should appear. Click "Confirm Unsubscribe".
    *   Verify the modal closes, a success message appears, and the slot reverts to showing "Sign Up".
8.  **Logout:**
    *   Click the "Sign Out" button in the header.
    *   Verify you are redirected back to the login page.
    *   Try accessing the root URL (`/`) directly; you should be redirected to login again.