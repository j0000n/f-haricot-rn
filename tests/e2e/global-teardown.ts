import type { FullConfig } from "@playwright/test";
import { stopMaildev } from "./utils/maildev-server";

export default async function globalTeardown(_: FullConfig) {
  await stopMaildev();
}
