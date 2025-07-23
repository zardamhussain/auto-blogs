# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY firebase-admin.json ./
RUN pip install google-generativeai
RUN pip install fastapi==0.115.12 starlette==0.43.0 bcrypt
RUN pip install tavily-python>=0.2.3
RUN pip install firecrawl>=0.2.0
RUN pip install google-genai
RUN pip install websockets

# Install any needed packages specified in requirements.txt
RUN pip install python-frontmatter   

COPY requirements.docker.txt ./

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.docker.txt
RUN pip install pytz

# Copy the backend source c

# Command to run the application
# Binds to 0.0.0.0 to be accessible from outside the container
# Sets reload to True to automatically restart on code changes in development
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 