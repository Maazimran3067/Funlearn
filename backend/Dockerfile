# We start from official Python 3.11
# "slim" means smaller size — removes things we don't need
FROM python:3.11-slim

# This is the folder inside the container where our code will live
WORKDIR /app

# These two lines make Python work better inside Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system tools Django needs
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first
COPY requirements.txt .

# Install all Python packages
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Now copy all our backend code into the container
COPY . .

# Our Django server runs on port 8000
EXPOSE 8000

# This command runs when container starts
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]