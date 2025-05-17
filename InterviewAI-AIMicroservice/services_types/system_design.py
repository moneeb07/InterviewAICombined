from pydantic import BaseModel, Field
from typing import Union

class SystemDesignQuestion(BaseModel):
    question: str
    answer: str
    designed_system_image_url: Union[str, None] = None

class Grade(BaseModel):
    grade: int = Field(description="This is the grade for the user that the user will get based on their performance in the system design round. This should be between 0 and 100. THis field is required.")
    feedback: str = Field(description="This is the detailed feedback of the user's performance in the system design round. This field is required.")
