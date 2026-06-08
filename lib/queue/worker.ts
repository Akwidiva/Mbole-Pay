import { Worker, Queue } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

export const emailQueue = new Queue('email', { connection })

// Worker to process email jobs
export const startQueueWorker = () => {
  const worker = new Worker('email', async job => {
    // job.data should contain { to, subject, html }
    console.log('Processing email job', job.id, job.name)
    // For now just log; integrate with your email service
    // import lib/services/email-service.ts and call send
    return Promise.resolve(true)
  }, { connection })

  worker.on('completed', job => {
    console.log('Job completed', job.id)
  })

  worker.on('failed', (job, err) => {
    console.error('Job failed', job?.id, err)
  })

  return worker
}
