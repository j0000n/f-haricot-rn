const POSTHOG_API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "phc_3kmb0qG3FfuQbff7De5ZjpUK8k4RaEKgXW21LLwdgTq";

const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

const POSTHOG_BASE_OPTIONS = {
  host: POSTHOG_HOST,
  captureApplicationLifecycleEvents: true,
  captureScreens: true,
};

export { POSTHOG_API_KEY, POSTHOG_HOST, POSTHOG_BASE_OPTIONS };
