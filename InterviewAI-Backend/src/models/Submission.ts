import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  code: { type: String, required: true },
  language: { type: String, required: true },
  input: { type: String },
  output: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  result: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
