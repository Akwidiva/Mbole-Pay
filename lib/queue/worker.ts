import { Worker, Queue } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";

type EmailJobPayload = {
  to: string;
  subject: string;
  html: string;
};

export const emailQueue = new Queue<EmailJobPayload>("email", {
  connection: redisConnection,
});

// Worker to process email jobs
export const startQueueWorker = () => {
  const worker = new Worker<EmailJobPayload>(
    "email",
    async (job) => {
      console.log("Processing email job", job.id, job.name);
      return true;
    },
    { connection: redisConnection }
  );

  worker.on("completed", (job) => {
    console.log("Job completed", job.id);
  });

  worker.on("failed", (job, err) => {
    console.error("Job failed", job?.id, err);
  });

  return worker;
};
