import codeQueue from "../lib/queue";
import { Response } from "express";
import { AuthenticatedRequest } from "../types/Requests";
import Submission from "../models/Submission";

export const submitCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, language, input, output } = req.body;
    const userId = req.user.id

    // Create a submission record
    console.log("I am in the submitCode controller userId", userId)
    const submission = await Submission.create({
      code,
      language,
      input,
      output,
      status: "pending",
      userId,
    });

    // Add to queue for evaluation
    await codeQueue.add("evaluate", {
      submissionId: submission._id,
      code,
      language,
      input,
      output,
      userId,
    });
    return res.json({
      submissionId: submission._id,
      message: "Code submitted successfully!",
    });
  } catch (error) {
    console.error("Error submitting code:", error);
    return res.status(500).json({ error: "Failed to submit code" });
  }
};

export const getSubmission = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { submissionId } = req.params;
    const user = req.user;
    console.log("userwar gai", user)
    console.log("submissionId", submissionId)
    // if (!user) {
    //   return res
    //     .status(400)
    //     .json({ error: "user is required in the request body" });
    // }
    // Find submission and ensure it belongs to the requesting user
    console.log("this is the user id", user.id)
    console.log("this is the submission id", submissionId)
    const submission = await Submission.findOne({
      _id: submissionId,
      userId: user.id,
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    return res.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return res.status(500).json({ error: "Failed to fetch submission" });
  }
};

export const getInterviewSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { interviewId } = req.params;

    const submissions = await Submission.find({ interviewId })
      .select('code language status result createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching interview submissions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch submissions'
    });
  }
};
