// src/workers/codeEvaluation.worker.ts
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { evaluateCodeUsingJudge0 } from "../services/judge0.service";
import Submission from "../models/Submission";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI!, {})
  .then(() => {
    console.log("Worker: Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Worker: Failed to connect to MongoDB:", err);
    process.exit(1); // Optionally exit if connection fails
  });

const codeEvaluationWorker = new Worker(
  "codeQueue",
  async (job) => {
    console.log("Worker picked up job:", job.id, job.data);
    try {
      const { submissionId, code, language, input, output, userId } = job.data;

      // Update submission status to processing
      await Submission.findByIdAndUpdate(submissionId, {
        status: "processing",
        updatedAt: new Date(),
      });

      // Evaluate the code
      const evaluationResult = await evaluateCodeUsingJudge0({
        code,
        language,
        input,
        output,
      });

      console.log("evaluationResult", evaluationResult)

      // Helper to normalize output for comparison
      function normalizeOutput(str: string | null) {
        if (!str) return '';
        // Remove all whitespace (spaces, tabs, newlines, carriage returns)
        return str.replace(/\s/g, '').trim();
      }
      console.log("I am here")
      console.log('Normalized stdout:', JSON.stringify(normalizeOutput(evaluationResult.stdout)));
      console.log('Normalized output:', JSON.stringify(normalizeOutput(output)));
      // Update submission with results
      const isCorrect = normalizeOutput(evaluationResult.stdout) === normalizeOutput(output);

      await Submission.findByIdAndUpdate(submissionId, {
        status: "completed",
        result: {
          ...evaluationResult,
          isCorrect,
        },
        updatedAt: new Date(),
      });
      return {
        submissionId,
        evaluationResult,
        isCorrect,
      };
    } catch (error: unknown) {
      console.error("Error in code evaluation worker:", error);

      // Update submission status to failed
      if (job.data.submissionId) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        await Submission.findByIdAndUpdate(job.data.submissionId, {
          status: "failed",
          result: { error: errorMessage },
          updatedAt: new Date(),
        });
      }

      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      tls: {
        rejectUnauthorized: false,
      },
    },
  }
);

codeEvaluationWorker.on("completed", (job, returnvalue) => {
  console.log(`Job ${job.id} completed!`, returnvalue);
});

codeEvaluationWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed!`, err);
});

export default codeEvaluationWorker;
