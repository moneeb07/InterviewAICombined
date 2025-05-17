from openai import OpenAI
from pydantic import BaseModel, Field
from services_types.system_design import SystemDesignQuestion, Grade
from typing import List

class SystemDesignService:
    def __init__(self, openai_api_key: str, model_name: str = "gpt-4o-mini"):
        self.model_name = model_name
        self.openai_api_key = openai_api_key
        self.client = OpenAI(api_key=self.openai_api_key)
        self.system_design_prompt = """
        You are a system design expert.
        You will be given a problem statement and a user's system design.
        You will need to grade the user's system design and provide feedback.
        If the images and the answers of the user are empty then you should return a grade of 0 and a feedback that the user has not provided a solution.
        Be very critical and strict with the grading.
        The grade should be between 0 and 100.
        Both of the fields are required.
        """

    def _create_question_messages(self, question: SystemDesignQuestion) -> List[dict]:
        """Creates the message structure for a single system design question.
        
        Args:
            question: The system design question to create messages for
            
        Returns:
            List of message dictionaries containing the question and answer
        """
        messages = []
        
        # AI message - problem statement
        messages.append({
            "role": "assistant", 
            "content": [
                {
                    "type": "output_text",
                    "text": question.question
                }                
            ]
        })
        
        # User message - user's solution/response
        content = [{"type": "input_text", "text": question.answer}]
        if question.designed_system_image_url:
            content.append({
                "type": "input_image",
                "image_url": question.designed_system_image_url
            })
        messages.append({
            "role": "user",
            "content": content
        })
        
        return messages

    def grade_system_design(self, system_design_questions: List[SystemDesignQuestion]) -> Grade:
        messages = [
            {"role": "system", 
             "content": [
                {
                    "type": "input_text",
                    "text": self.system_design_prompt
                }
            ]}
        ]
        
        # Add messages for each system design question
        for question in system_design_questions:
            messages.extend(self._create_question_messages(question))
        
        response = self.client.responses.parse(
            model=self.model_name,
            input=messages,
            text_format=Grade
        )
        
        # Process the response to extract grade and feedback
        completion = response.output_parsed
        
        try:
            return completion
        except Exception as e:
            # Fallback with a default grade and the full completion as feedback
            raise e