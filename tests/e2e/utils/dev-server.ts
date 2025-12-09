import { once } from "events";
import { spawn, type ChildProcess } from "child_process";

const defaultBaseUrl = process.env.E2E_BASE_URL ?? "http://localhost:8081";

let devServer: ChildProcess | undefined;

async function waitForServer(baseURL: string, timeoutMs = 180_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(baseURL, { method: "GET" });
      if (response.ok) return;
    } catch {
      // keep retrying
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Expo web dev server did not become ready at ${baseURL}`);
}

export async function startDevServer(baseURL: string = defaultBaseUrl) {
  if (devServer) {
    await waitForServer(baseURL);
    return;
  }

  devServer = spawn(
    "npx",
    [
      "expo",
      "start",
      "--web",
      "--host",
      "localhost",
    ],
    {
      env: {
        ...process.env,
        CI: "1",
        EXPO_NO_TELEMETRY: "1",
      },
      stdio: "pipe",
    }
  );

  devServer.stdout?.on("data", (data: Buffer) => {
    process.stdout.write(`[expo] ${data}`);
  });

  devServer.stderr?.on("data", (data: Buffer) => {
    process.stderr.write(`[expo] ${data}`);
  });

  devServer.on("error", (error) => {
    console.error("Expo dev server failed to start", error);
  });

  await waitForServer(baseURL);
}

export async function stopDevServer() {
  if (!devServer) return;

  devServer.kill("SIGTERM");
  await once(devServer, "exit");
  devServer = undefined;
}
