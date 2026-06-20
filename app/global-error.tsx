"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log("[v0] global error:", error.message, error.digest)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#e9e7f2",
          color: "#1c1b22",
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: 28,
            borderRadius: 20,
            background: "#fff",
            border: "1px solid #dcd9ea",
          }}
        >
          <h1 style={{ fontSize: 22, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#5b5870" }}>
            The app hit a fatal error. Details below.
          </p>
          <pre
            style={{
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#f3f1fa",
              padding: 12,
              borderRadius: 12,
            }}
          >
            {error.message || "Unknown error"}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              border: "none",
              background: "#1c1b22",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
