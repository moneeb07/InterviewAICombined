from pydantic import BaseModel, Field
from typing import List

class Round(BaseModel):
    type: str = Field(description="The type of the round")
    score: int = Field(description="The score of the round")
    remarks: str = Field(description="The remarks of the round")

class FinalInterviewInputs(BaseModel):
    job_description: str = Field(description="The job description")
    job_role: str = Field(description="The job role")
    framework: str = Field(description="The frameworks of the job")
    parsed_cv: str = Field(description="The parsed markdown of the cv")
    rounds: List[Round] = Field(description="The rounds of the interview with the necessry information")

class FinalInterviewOutputs(BaseModel):
    score: int = Field(description="The score of the interview, must be between 0 and 100. You must be very strict with the scoring.")
    remarks: str = Field(description="The detailed remarks of the interview. Take into considering the job details, the cv, the rounds and the score to make the decision.")
