FROM python:3.12-slim

# Install uv (Python package installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy requirements
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy the rest of the application into the container
COPY . .

# Expose the API port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "main.py"]