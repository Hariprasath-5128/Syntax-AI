from fastapi import FastAPI
from pydantic import BaseModel
from ai_agent import handle_task  # Import AI agent function
import subprocess
import threading
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

# Pydantic model to parse incoming JSON request
class RequestModel(BaseModel):
    taskType: str
    prompt: str

# Function to run outputpage.py in a new console with error handling
def run_script():
    try:
        logging.info("Attempting to start outputpage.py...")
        process = subprocess.Popen(
            ['python', r'C:\Projects\Syntax AI\outputpage.py'],
            creationflags=subprocess.CREATE_NEW_CONSOLE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True  # Capture output as text
        )
        stdout, stderr = process.communicate()

        if stdout:
            logging.info(f"outputpage.py stdout: {stdout.strip()}")
        if stderr:
            logging.error(f"outputpage.py stderr: {stderr.strip()}")

    except Exception as e:
        logging.error(f"Failed to start outputpage.py: {e}")

# API endpoint to process requests
@app.post("/process-request")
async def process_request(request: RequestModel):
    task_type = request.taskType
    prompt = request.prompt

    logging.info(f"Received request: taskType={task_type}, prompt={prompt}")

    try:
        # Call the AI agent function to handle the task
        result = handle_task(prompt)
        logging.info(f"AI Response: {result}")

        # Run outputpage.py in a separate thread
        threading.Thread(target=run_script, daemon=True).start()

        return {"result": result}

    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return {"error": "Internal Server Error"}

# Run the server using: python -m uvicorn server:app --reload