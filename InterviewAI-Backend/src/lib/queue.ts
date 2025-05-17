import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

const codeQueue = new Queue("codeQueue", {
  connection: redisConnection,
});
export default codeQueue;
