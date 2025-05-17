from pydantic import BaseModel, Field

class ParsedCV(BaseModel):
    parsed_markdown: str = Field(description="The parsed markdown of the cv")

    
class IncomingCV(BaseModel):
    cv_url: str = Field(description="The url of the cv to be parsed")