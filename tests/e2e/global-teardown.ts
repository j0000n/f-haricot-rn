import type { FullConfig } from "@playwright/test";
import { stopDevServer } from "./utils/dev-server";
import { stopMaildev } from "./utils/maildev-server";

export default async function globalTeardown(_: FullConfig) {
  await stopDevServer();
  await stopMaildev();
}
