from openai import OpenAI
from services_types.final_interview import FinalInterviewInputs, FinalInterviewOutputs

class FinalInterviewEvaluator:
    def __init__(self, api_key: str = None, model_name: str = "gpt-4.1", temperature: float = 0):
        self.api_key = api_key
        self.temperature = temperature
        self.client = OpenAI(api_key=self.api_key)
        self.model_name = model_name
        self.prompt = """
You are an expert interview evaluator for technical positions. You will evaluate a completed interview and provide a final assessment.

# INTERVIEW INFORMATION
- Job Description: {job_description}
- Job Role: {job_role}
- Required Framework(s): {framework}

# CANDIDATE INFORMATION
## Parsed CV/Resume:
{parsed_cv}

# INTERVIEW ROUNDS PERFORMANCE
{rounds_summary}

# EVALUATION INSTRUCTIONS
1. Consider the candidate's qualifications from their CV/resume against the job requirements
2. Evaluate their performance across all interview rounds
3. Determine if they have the necessary technical skills and experience
4. Be strict and critical in your assessment - we need to select only the best candidates
5. Provide a detailed evaluation with specific examples from their performance

# OUTPUT REQUIREMENTS
Your final evaluation should include:
1. A score between 0-100, with 70+ indicating an acceptable candidate
2. Detailed remarks explaining your scoring decision, including:
   - Strengths demonstrated across the interview
   - Weaknesses or areas of concern
   - Whether you recommend hiring them (only for scores 75+)
   - Specific examples from their interview rounds and CV
"""

    def evaluate(self, interview: FinalInterviewInputs) -> FinalInterviewOutputs:
        # Create a formatted summary of the rounds
        rounds_summary = ""
        print("Rounds incoming", interview.rounds)
        for i, round in enumerate(interview.rounds):
            rounds_summary += f"## Round {i+1}: {round.type}\n"
            rounds_summary += f"- Score: {round.score}/100\n"
            rounds_summary += f"- Evaluator Remarks: {round.remarks}\n\n"
        
        # Format the prompt with the interview data
        formatted_prompt = self.prompt.format(
            job_description=interview.job_description,
            job_role=interview.job_role,
            framework=interview.framework,
            parsed_cv=interview.parsed_cv,
            rounds_summary=rounds_summary
        )

        print("Format")
        
        # Call the LLM to evaluate the interview
        response = self.client.responses.parse(
            model=self.model_name,
            input=formatted_prompt,
            text_format=FinalInterviewOutputs
        )
        
        # Extract the content from the response
        result = response.output_parsed
        
        return result
