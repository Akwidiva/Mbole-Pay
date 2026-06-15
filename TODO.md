# Queue / Background Jobs (BullMQ) TODO

- [x] Analyze current architecture and confirm Redis-first queue approach
- [x] Add BullMQ dependencies
- [x] Implement shared Redis queue connection
- [x] Implement queue definitions and typed job payloads
- [x] Implement workers (notifications, payment retries, reports, scheduler)
- [x] Implement enqueue helpers
- [x] Wire worker bootstrap into server runtime safely
- [x] Integrate at least one concrete producer flow end-to-end
- [x] Update README with Queue / Background Jobs operational guide
- [x] Validate implementation and finalize
