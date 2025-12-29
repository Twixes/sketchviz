import type { Config } from "next-globe-gen";

const config: Config = {
  locales: ["en", "pl"],
  defaultLocale: "en", // Fallback when browser detection fails
};

export default config;
