import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai_agent import handle_task

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(title="Syntax AI Server")

class RequestModel(BaseModel):
    taskType: str
    prompt: str

# --- API Endpoint ---

@app.post("/process-request")
async def process_request(request: RequestModel):
    try:
        # Get the result from AI
        result = handle_task(request.prompt)
        
        # Convert result to string if it's not already
        if hasattr(result, 'content'):
            result_str = result.content
        elif isinstance(result, dict):
            result_str = str(result)
        else:
            result_str = str(result)
        
        return {"status": "success", "result": result_str}
    except Exception as e:
        logging.exception("Error")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)