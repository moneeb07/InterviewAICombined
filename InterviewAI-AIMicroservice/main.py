from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
import os
from services.system_design import SystemDesignService
from services_types.system_design import SystemDesignQuestion, Grade
from services.cv_parse import CVParseService
from services_types.cv_parser import ParsedCV, IncomingCV
from services.final_interview_evaluator import FinalInterviewEvaluator
from services_types.final_interview import FinalInterviewInputs, FinalInterviewOutputs
from typing import List

load_dotenv(find_dotenv())

app = FastAPI(
    title="InterviewAI AI Microservice",
    description="A microservice for InterviewAI's AI capabilities",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("THE VALUE of the test variable is ", os.getenv("TEST_VARIABLE", "NOT SET"))

@app.get("/")
async def root():
    return {"message": "Welcome to the Dockerized InterviewAI AI Microservice, CI CD is now working !"}

@app.get("/test")
async def test_endpoint():
    return {
        "status": "success",
        "message": "Test endpoint is working!",
        "data": {
            "service": "InterviewAI AI Microservice",
            "version": "1.0.0"
        }
    }

openai_model_name = "gpt-4o"

@app.post("/api/system-design/grade")
async def grade_system_design(questions: List[SystemDesignQuestion]) -> Grade:
    service = SystemDesignService(openai_api_key=os.getenv("OPENAI_API_KEY"), model_name=openai_model_name)
    grade = service.grade_system_design(questions)
    return grade

@app.post("/api/cv-parse")
async def parse_cv(cv: IncomingCV) -> ParsedCV:
    service = CVParseService(mistral_api_key=os.getenv("MISTRAL_API_KEY"))
    parsed_cv = service.parse_cv(cv)
    return parsed_cv

@app.post("/api/interview/evaluate")
async def evaluate_interview(interview: FinalInterviewInputs) -> FinalInterviewOutputs:
    service = FinalInterviewEvaluator(api_key=os.getenv("OPENAI_API_KEY"), model_name=openai_model_name)
    result = service.evaluate(interview)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True if os.getenv("ENV") == "dev" else False)
