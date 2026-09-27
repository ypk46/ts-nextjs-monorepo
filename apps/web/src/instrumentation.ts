// Runs once at server boot (not during `next build`); exits if the env is invalid.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./server/boot");
  }
}
