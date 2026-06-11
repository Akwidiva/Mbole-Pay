type LogLevel = "debug" | "info" | "warn" | "error"

type LogContext = Record<string, unknown>

function toMessage(message: string, context?: LogContext) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    ...context,
  })
}

async function pushToLoki(level: LogLevel, scope: string, message: string, context?: LogContext) {
  const lokiUrl = process.env.LOKI_URL
  if (!lokiUrl) return

  const endpoint = lokiUrl.endsWith("/loki/api/v1/push")
    ? lokiUrl
    : `${lokiUrl.replace(/\/$/, "")}/loki/api/v1/push`

  const payload = {
    streams: [
      {
        stream: {
          service: "mbole-pay",
          scope,
          level,
        },
        values: [[String(BigInt(Date.now()) * 1000000n), toMessage(message, context)]],
      },
    ],
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    // Loki is optional in dev; console logging still works.
  }
}

export function createLogger(scope: string) {
  const emit = (level: LogLevel, message: string, context?: LogContext) => {
    const line = toMessage(message, { scope, level, ...context })

    if (level === "error") {
      console.error(line)
    } else if (level === "warn") {
      console.warn(line)
    } else if (level === "debug") {
      console.debug(line)
    } else {
      console.log(line)
    }

    void pushToLoki(level, scope, message, context)
  }

  return {
    debug: (message: string, context?: LogContext) => emit("debug", message, context),
    info: (message: string, context?: LogContext) => emit("info", message, context),
    warn: (message: string, context?: LogContext) => emit("warn", message, context),
    error: (message: string, context?: LogContext) => emit("error", message, context),
  }
}
