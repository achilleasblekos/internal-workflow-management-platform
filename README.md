# Internal Workflow Management Platform

## 1. Project Overview

This project is an internal workflow management web platform for handling tasks through a simple workflow lifecycle.

The business domain is intentionally generic, allowing the implementation to focus on the engineering aspects of the solution.

The platform emphasizes full-stack engineering, architectural clarity, maintainability, scalability, and attention to code quality and documentation.

## 2. Functional Requirements

The platform supports the following core requirements:

- Task creation and management
- Task status transitions across a predefined workflow lifecycle (e.g., Open → In Progress → Completed)
- Task filtering by status
- Basic audit information, including creation and last update timestamps
- User authentication

Authentication is implemented through email-based login and JWT authentication.

## 3. System Architecture and Design Choices

The platform is implemented as a full-stack web application composed of three clearly separated parts:

- **Frontend**: a React + TypeScript application responsible for the user interface, routing, task interactions, and client-side state management
- **Backend**: a Django REST Framework application responsible for business logic, authentication, validation, and API delivery
- **Database**: a PostgreSQL instance responsible for the persistent storage of users and tasks

This separation keeps responsibilities well-defined across the stack and supports maintainability, scalability, and a cleaner development workflow. All services are containerized and orchestrated through Docker Compose, allowing the system to run locally in a consistent and reproducible way.

### Backend design

The backend was implemented with Django and Django REST Framework in order to provide a structured and maintainable foundation for a workflow-driven application.

This combination was particularly suitable because it supports:

- RESTful API development
- serializer-based request and response validation
- model-driven data access
- authentication and permission handling
- clear separation between models, serializers, and views

Compared to a lighter framework such as FastAPI, Django was a strong fit for this platform because it provides more built-in functionality out of the box. In particular, it includes:

- built-in support for database modeling and querying through an Object-Relational Mapping (ORM) layer
- built-in authentication foundations
- migrations for schema evolution
- management commands for custom development and operational tasks
- a well-established project structure

These capabilities made it possible to focus more directly on workflow rules, validation, and system organization.

PostgreSQL was selected as the persistence layer because it fits well with structured relational data and aligns naturally with a multi-service application setup.

The backend also includes:

- a custom user model that uses email instead of username, making authentication more practical and aligned with common real-world login flows
- JWT authentication with refresh token rotation and blacklist support, allowing secure stateless API access
- OpenAPI/Swagger documentation through drf-spectacular for API exploration and testing
- a custom `wait_for_db` management command, which ensures that the backend starts only after the database is available
- a custom `seed_tasks` management command, which allows sample task data to be generated quickly for a specific user

### Frontend design

The frontend was implemented with React because it supports a modular, component-based architecture that fits well with task management interfaces and helps maintain a clear separation between UI structure, interaction logic, and data access.

TypeScript was used to improve maintainability through stronger type safety, especially across API models, task states, reusable component props, and route-related data.

Vite was selected to provide a fast and lightweight development workflow with minimal configuration overhead.

The frontend also uses:

- **TanStack Router**, to organize the application around a clear route-based structure
- **TanStack Query**, to manage asynchronous server state, including data fetching, mutations, caching, and query invalidation
- **Tailwind CSS**, to support a utility-based styling approach and keep UI development consistent
- **shadcn/ui**, to build reusable and composable UI components on top of Tailwind CSS
- **dnd-kit**, to support drag-and-drop interactions in the Kanban board interface

This combination supports a maintainable frontend structure, clearer user flows, reusable UI patterns, and a cleaner separation between presentation logic and server-state management.

## 4. Docker & Environment

The platform is fully containerized with Docker and Docker Compose, with clear separation between the following services:

- **frontend**: runs the React + TypeScript application
- **backend**: runs the Django REST API
- **db**: runs the PostgreSQL database

This setup keeps the application layers isolated, simplifies local development, and allows the full system to run in a consistent and reproducible way.

### Prerequisites

Before running the project locally, make sure the following tools are installed:

- Docker
- Docker Compose

### Environment configuration

The project uses separate environment files for the backend and frontend:

- `backend/.env`, which contains the Django and database-related environment variables used by the backend service
- `frontend/.env`, which contains the Vite environment variable used by the frontend application to communicate with the backend API

Examples of these environment files are provided in:

- `backend/.env.example`
- `frontend/.env.example`

### Running the application locally

#### 1. Clone the repository

```bash
git clone https://github.com/achilleasblekos/internal-workflow-management-platform.git
cd internal-workflow-management-platform
```

This downloads the repository and moves into the project directory.

#### 2. Create the environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

These commands create the local environment files required by the backend and frontend services.

#### 3. Build and start the full system

```bash
docker compose up --build
```

This command builds the images if needed and starts all services, including:

- the PostgreSQL database
- the Django backend
- the React frontend

On backend startup, the application also performs the following steps automatically:

- waits for the database to become available
- applies database migrations
- starts the Django development server

#### 4. Access the running services

Once the containers are running, the application is available at:

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000/api/v1/`
- **Swagger UI**: `http://localhost:8000/api/v1/docs/`
- **Django Admin**: `http://localhost:8000/admin/`

### Useful development commands

#### Create a superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

Creates an administrative user for accessing the Django admin interface at `http://localhost:8000/admin/`

#### Seed sample tasks for a user

```bash
docker compose exec backend python manage.py seed_tasks --email user@example.com
```

Inserts sample task data for an existing user account. This is useful for quickly populating the platform after registration or login.

#### Run backend tests

```bash
docker compose exec backend python manage.py test
```

Runs the backend test suite inside the backend container.

#### Run backend linting

```bash
docker compose exec backend flake8 .
```

Runs Python linting checks for backend code quality and consistency.

#### Run frontend linting

```bash
docker compose exec frontend npm run lint
```

Runs ESLint on the frontend codebase.

#### Build the frontend

```bash
docker compose exec frontend npm run build
```

Creates a production build of the frontend application.

#### Stop the application

```bash
docker compose down
```

Stops and removes the running containers.

#### Stop the application and remove volumes

```bash
docker compose down -v
```

Stops the containers and removes associated volumes, including the database volume. This is useful when a completely fresh local setup is needed.

## 5. CI / Quality

The project includes a lightweight CI pipeline implemented with GitHub Actions to automate baseline quality checks across the stack.

### Automation coverage

The current workflow covers:

- **Backend test execution** using Django's test framework
- **Backend linting** with `flake8`
- **Frontend linting** with `ESLint`

This automation helps catch regressions in backend behavior, enforce consistent coding standards, and identify common frontend issues early in the development process.

### Notes

The current CI setup is intentionally lightweight and focused on code validation. It does not yet include frontend automated tests, end-to-end testing, or deployment workflows.

## 6. Trade-offs and Potential Improvements

The current implementation focuses on providing a clean, maintainable, and fully functional full-stack foundation, while keeping the overall scope manageable. As with any engineering solution, some choices were made deliberately to balance implementation time, simplicity, and extensibility.

### Trade-offs

- **Development-oriented configuration**
  The current setup is optimized primarily for local development and ease of execution. Some settings, such as development-focused environment configuration, would need to be tightened for a production deployment.

- **JWT-based authentication approach**
  JWT authentication provides a clean and practical solution for securing the API and supporting frontend-backend separation. However, in a production environment, token storage and refresh handling could be hardened further depending on the security requirements of the platform.

- **Lightweight CI scope**
  The current CI pipeline covers backend tests, backend linting, and frontend linting, which provides a useful baseline for quality control. It does not yet include frontend automated tests, integration testing, or deployment automation.

- **Single-user ownership model**
  The current application focuses on authenticated users managing their own tasks. More advanced collaboration scenarios, such as shared workspaces, team ownership, or role-based access control, are not yet included.

- **Local-first deployment model**
  The platform is fully containerized and easy to run locally, but it does not yet include cloud deployment configuration, monitoring, centralized logging, or infrastructure automation.

### Potential Improvements

- Add **frontend automated tests** for components, pages, and interaction flows
- Add **integration and end-to-end tests** across frontend and backend
- Introduce **role-based access control (RBAC)** for more advanced authorization scenarios
- Extend the workflow model with **additional task states**, assignees, or approval flows
- Add **task comments, activity history, or audit trail views**
- Improve **advanced filtering, sorting, and pagination options** for larger task datasets
- Strengthen **production security hardening**, including stricter environment-specific settings
- Add **CI/CD workflows** for staging and production environments
- Add **monitoring, logging, and observability** support for production operation
- Improve the user experience further with **notifications, optimistic updates, and richer dashboard insights**
