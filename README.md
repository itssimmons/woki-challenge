# Woki Challenge Experience

First of all, thank you for taking the time to review my challenge proposal. In this repository, you will find my implementation of the Woki Challenge, as well as the documentation needed to understand my thought process and decisions made during the development.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Environments](#available-environments)
- [Technologies Used](#technologies-used)
- [Decisions & Thought process](#decisions--thought-process)
	- [API Versioning](#api-versioning)
	- [Datetime Handling](#datetime-handling)
	- [Database & Caching](#database--caching)
	- [Testing](#testing)
	- [Documentation](#documentation)
	- [Gaps](#gaps)
	- [Wokibrain](#wokibrain)
	- [Benchmarking](#benchmarking)
	- [Metrics](#metrics)
	- [CI/CD](#cicd)
- [Author](#author)

## Project Structure

```
woki-challenge/
│── 📁 .github/workflows         # GitHub Actions workflows for CI/CD
│── 📂 app/                      # Main application source code
│   ├── 📁 bootstrap/            # Application bootstrap files
│   ├── 📁 config/               # Configuration files (environment, logging)
│   ├── 📁 controllers/          # Route controllers
│   ├── 📁 core/                 # Core application logic (Gaps, Wokibrain)
│   ├── 📁 database/             # Database related files (SQLite & Redis)
│   ├── 📁 exceptions/           # Custom exception handling
│   ├── 📂 lib/                  # Library files
│   │   ├── 📁 addons/           # Additional libraries or plugins (dayjs)
│   │   ├── 📁 consts/           # Constant values
│   │   ├── 📁 prototypes/       # Prototype extensions (Array.limit, Array.sortBy, Clock.slots, etc.)
│   │   └── 📁 utils/            # Utility functions (Backtracking, Mutex, etc.)
│   ├── 📁 routes/               # Application routes
│   ├── 📁 schemas/              # Request validation schemas
│   ├── 📁 types/                # TypeScript type definitions *.d.ts
│   ├── app.ts                   # Main application file
│   └── server.ts                # Server setup file
│── 📁 tests/                    # Test cases for the application
│── 📁 packages/                 # Monorepo packages (only cli/ for now)
│── 📁 docs/                     # Documentation files (Swagger & SwaggerUI)
│── 📁 benchmarks/               # Benchmarking scripts
│── spell                        # Spell caster shell script for running commands easily
│── .node-version                # Node.js version file
│── README.md                    # 👈 You are here!
│── tsconfig.*.json              # Multiple purposes TypeScript configurations
└── ...
```

## Getting Started

I'm going to offer you 2 ways to get started with the project: using **Docker** or running it **locally**.

Once the project is up and running, you can access the API documentation at: http://127.0.0.1:8080/apidocs

### Using Docker (recommended)

```bash
docker compose up --build
# to stop the containers
docker compose down
```

### Running Locally

I'm assuming you already have nvm installed. If not, please refer to https://github.com/nvm-sh/nvm

#### Pre-requisites

1. Install [Redis locally](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/) or via docker `docker run -d --name redis -p 6379:6379 redis:latest`
2. It is not needed, but highly recommended, create a `.env` file at the root of the project and paste the content of the `.env.example` file. (It is good enough to test the project right away)
3. Having a [Node Version Manager](https://github.com/nvm-sh/nvm#installing-and-updating) nvm to meention one, installed on your machine

#### Unix-based Systems (Linux & MacOS)
**Bash/Shell**

```bash
# Install dependencies
nvm install $(cat .node-version)
npm i -g pnpm

# Copy environment file
cp .env.example .env.development

# Database migration and seeding, using your existing exec script
chmod u+x ./spell
./spell db --migrate --seed

# Start development server
./spell start
```

#### Windows
**PowerShell**

```powershell
# Install dependencies
nvm install (Get-Content .node-version)
npm i -g pnpm
pnpm install

# Copy environment file
Copy-Item .env.example .env.development

# Database migration and seeding, using your existing exec script
pnpm run exec ./app/database/cmdline.ts --migrate --seed

# Start development server
pnpm run dev
```

## Available Environments

You can start playing around with the API at the hosted version deployed as a Google Cloud Run Function:
 
- API Docs: https://woki-challenge-141517873406.us-east1.run.app/apidocs
- Metrics: https://woki-challenge-141517873406.us-east1.run.app/metrics

## Technologies Used

The following technologies and tools were used in this project:

- **Node.js@24**: JavaScript runtime environment.
- **TypeScript@5.9.3**: Superset of JavaScript for static typing.
- **Fastify@5**: Web framework for building APIs.
- **Fastify Built-in Pino Logger**: Logging library for Fastify.
- **ESBuild**: JavaScript bundler and minifier.
- **Swagger & SwaggerUI**: API documentation tools.
- **Zod**: Schema validation library.
- **Day.js**: Date manipulation library.
- **SQLite**: Lightweight relational database.
- **Redis**: In-memory data structure store for caching.
- **Jest**: Testing framework for unit and integration tests.
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment.

## Decisions & Thought process

Let's break down my experience working on this challenge, for you, what I thought, what I liked, and what could be improved:

### API Versioning

I implemented API versioning using URL path versioning (e.g., `/1/woki/*`). This approach allows for clear differentiation between different versions of the API, making it easier to manage changes and maintain backward compatibility.

### Datetime Handling

Although JavaScript's native `Date` object provides basic date and time functionalities, it is an implementation that I've always tried to avoid; it was influenced by Java back in the day, and has several quirks and limitations that can lead to unexpected behaviour, or several amounts of code just to perform minimal functionalities.

A **2KB** option is `dayjs`, a lightweight library that offers a simple and consistent API for parsing, validating, manipulating, formatting dates, and most importantly, timezone translation. It provides a more intuitive and reliable way to handle datetime operations compared to the native `Date` object.

### Database & Caching

For the purpose of this challenge, I chose SQLite as the database (more explicitly `node:sqlite` from node version 24) due to its simplicity and ease of setup. It allowed me to focus on the core functionality without the overhead of managing a more complex database system.

To avoid a race condition, the first option that came to my mind was to use Redis as a caching layer. This decision was made to ensure data consistency and improve performance when handling concurrent requests, due to the speed of in-memory & single-threaded event loop operations.

### Testing

As you can see, I not only wrote unit tests for the endpoints or the criteria of the challenge (section 7), but also for the core logic and utility functions. This comprehensive testing approach helps ensure the reliability and correctness of the application. In fact, this approach allowed me to catch edge cases and potential bugs even before thinking about endpoints.

### Documentation

I used Swagger to document the API endpoints, providing clear and concise information about each endpoint's purpose, request parameters, and response formats. This documentation is essential for developers who will be consuming the API, as it helps them understand how to interact with the service effectively.

### Gaps

One of the most challenging aspects of this project was implementing the gap-finding algorithm. I opted for a backtracking approach to efficiently explore possible combinations of time slots and identify suitable gaps for scheduling. This method allowed me to handle complex scenarios and ensure that the algorithm could adapt to various constraints and requirements.

It's nothing more than a recursive pattern that gives an exhaustive look for all possible paths, accepting and rejecting paths as soon as they are found to be invalid or valid, respectively.

> For performance reasons, I only considered gaps that are equal to or larger than the desired capacity with a buffer plus of 3, as well as pruning duplicates paths like (T1+T2) (T2+T1) or (T1+T1).

> BigO notation of this algorithm is O(2^n) in the worst case scenario, where n is the number of slots available. However, due to the pruning of invalid paths, the average case performance is significantly better. an algorithm of O(n^2) also cross in my mind, and I still thought that it wasn't a bad idea, but since the facility of backtracking to prune invalid paths, to not explore them further, made me decide to for backtracking.

### Wokibrain

Now, having all the pieces together, I implemented a simple arithmetic which is: `( (max size of the table(s) - desired capacity) - 10 )`, all non-positive values are shifted to 0, because it's irrelevant to score gaps that can't fit the desired capacity (This array of gaps is sorted in descending order). At this way I'm scoring based on how much this extra capacity is wasted.

> In the case of reservations, the first scored gap is the one that is selected as the best candidate.

### Benchmarking

I created benchmarking scripts to measure the performance of the gap-finding algorithm under various scenarios. These benchmarks help identify potential bottlenecks and areas for optimization, ensuring that the algorithm performs efficiently even with larger datasets.

### Metrics

To monitor the performance and health of the application, I integrated basic metrics collection using Nodejs Prometheus. This setup allows me to track key performance indicators, such as response times, error rates, and resource utilization, providing valuable insights into the application's behavior.

### CI/CD

I set up a CI/CD pipeline using GitHub Actions to automate the testing and deployment process. The deployments run every time a tag is created, following the semantic versioning convention. The project is built by a Docker image and published to a registry that Google Cloud Run can access, enabling seamless and efficient deployment of the application. If any test fails, the deployment process is halted to ensure that only stable and reliable code is deployed.

## Author

This repository is the property of [@itssimmons](https://github.com/itssimmons) and is intended to showcase the approach I took to this take-home challenge.

<sup><em>last update sat 7 dec 2025 13:14</em><sup>
