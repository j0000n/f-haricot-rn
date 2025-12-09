import type { FullConfig } from "@playwright/test";
import { startDevServer } from "./utils/dev-server";
import { startMaildev } from "./utils/maildev-server";

export default async function globalSetup(_: FullConfig) {
  await startDevServer();
  await startMaildev();
}
