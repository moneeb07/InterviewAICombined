// src/services/judge0.service.ts
import axios from "axios";

interface EvaluateRequest {
  code: string;
  language: string;
  input: string;
  output: string;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

export async function evaluateCodeUsingJudge0({
  code,
  language,
  input,
  output,
}: EvaluateRequest): Promise<Judge0Response> {
  try {
    // Map your language to Judge0 language_id
    const languageId = mapLanguageToJudge0Id(language);

    if (!process.env.RAPID_API_KEY) {
      throw new Error("RAPID_API_KEY is not configured");
    }

    // Submit code to Judge0
    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        source_code: code,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const token = submission.data.token;

    // Polling the result with proper error handling
    let result: Judge0Response | undefined;
    for (let i = 0; i < 10; i++) {
      try {
        const { data } = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPID_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        if (data.status.id <= 2) {
          // In Queue or Processing
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        result = data;
        break;
      } catch (error) {
        if (i === 9) throw error; // Throw on last attempt
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!result) {
      throw new Error(
        "Failed to get evaluation result after multiple attempts"
      );
    }

    return result;
  } catch (error) {
    console.error("Error in Judge0 evaluation:", error);
    throw error;
  }
}

// Helper to map your internal language to Judge0
function mapLanguageToJudge0Id(language: string): number {
  const map: Record<string, number> = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
    typescript: 74,
    csharp: 51,
    ruby: 72,
    go: 60,
    rust: 73,
    swift: 83,
  };

  const languageId = map[language.toLowerCase()];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return languageId;
}
