import type MailDev from "maildev";

let server: MailDev | undefined;

export async function startMaildev() {
  if (server) return;

  const MailDevCtor = require("maildev") as typeof MailDev;
  server = new MailDevCtor({
    smtp: 1025,
    web: 1080,
    disableWebhook: true,
  });

  await new Promise<void>((resolve, reject) => {
    server?.listen((err?: Error) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export async function stopMaildev() {
  if (!server) return;

  await new Promise<void>((resolve, reject) => {
    server?.close((err?: Error) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  server = undefined;
}
