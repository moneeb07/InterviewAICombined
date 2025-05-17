
from pydantic import BaseModel, Field
from services_types.cv_parser import ParsedCV
from mistralai import Mistral, OCRPageObject
from typing import List
from services_types.cv_parser import IncomingCV

class CVParseService:
    def __init__(self, mistral_api_key: str, model_name: str = "mistral-ocr-latest"):
        self.model_name = model_name
        self.mistral_api_key = mistral_api_key
        self.client = Mistral(api_key=self.mistral_api_key)

    def parse_cv(self, cv: IncomingCV) -> ParsedCV:
        # Get the url of the cv
        cv_url = cv.cv_url

        ocr_response = self.client.ocr.process(
            model=self.model_name,
                document={
                    "type": "document_url",
                    "document_url": cv_url
                },
                include_image_base64=True
        )

        ocr_pages: List[OCRPageObject] = ocr_response.pages
        content: str = "\n".join([page.markdown for page in ocr_pages])

        # Return the markdown
        return ParsedCV(parsed_markdown=content)

