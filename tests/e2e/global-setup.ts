import type { FullConfig } from "@playwright/test";
import { startMaildev } from "./utils/maildev-server";

export default async function globalSetup(_: FullConfig) {
  await startMaildev();
}
