import { action } from "./_generated/server";

export const doSomething = action({
  args: {},
  handler: async () => {
    const data = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    return data.json();
  },
});
