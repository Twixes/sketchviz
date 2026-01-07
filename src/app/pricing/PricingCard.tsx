import { CheckIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

interface PricingCardProps {
  tier: "free" | "pro";
  title: string;
  price: number;
  priceDescription: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "secondary";
  buttonDisabled?: boolean;
  onButtonClick?: () => void;
  animationDelay: number;
}

export function PricingCard({
  tier,
  title,
  price,
  priceDescription,
  description,
  features,
  buttonText,
  buttonVariant,
  buttonDisabled = false,
  onButtonClick,
  animationDelay,
}: PricingCardProps) {
  const { data: planData } = usePlanQuery();

  const isPro = tier === "pro";
  const isCurrentPlan = tier === planData?.planType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FADE_TRANSITION, delay: animationDelay }}
      className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm"
    >
      <div className="relative flex-1">
        <div className="flex items-center gap-1">
          <h2 className="text-3xl font-bold text-black leading-none">
            {title}
          </h2>
          {isCurrentPlan &&
            (isPro ? (
              <svg
                className="size-6"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Current plan</title>
                <defs>
                  <linearGradient
                    id="checkmark-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="var(--accent-cobalt)" />
                    <stop offset="100%" stopColor="var(--accent-coral)" />
                  </linearGradient>
                </defs>
                <path
                  d="M11.467 3.727c.289.189.37.576.181.865l-4.25 6.5a.75.75 0 01-1.194.145l-2.75-2.5a.75.75 0 111.002-1.114l2.207 2.007 3.849-5.886a.75.75 0 01.955-.017z"
                  fill="url(#checkmark-gradient)"
                  strokeWidth="2"
                  stroke="url(#checkmark-gradient)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="size-6"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Current plan</title>
                <path
                  d="M11.467 3.727c.289.189.37.576.181.865l-4.25 6.5a.75.75 0 01-1.194.145l-2.75-2.5a.75.75 0 111.002-1.114l2.207 2.007 3.849-5.886a.75.75 0 01.955-.017z"
                  fill="currentColor"
                  strokeWidth="2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black"
                />
              </svg>
            ))}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span
            className={`text-6xl font-bold tracking-tight ${
              isPro ? "gradient-title" : "text-black"
            }`}
          >
            ${price}
          </span>
          <span className="text-lg text-black/50">
            {" "}
            {price > 0 && planData?.isVatApplicable && (
              <div className="text-base leading-tight"> + VAT</div>
            )}
            {priceDescription}
          </span>
        </div>
        <p className="mt-3 text-base text-black/60">{description}</p>

        <ul className="mt-4 space-y-4">
          {features.map((feature, index) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  isPro || index < features.length - 2
                    ? "bg-linear-to-br/oklch from-[color:var(--accent-cobalt)] to-[color:var(--accent-coral)]"
                    : "bg-black/10"
                }`}
              >
                <CheckIcon
                  className={`size-4 ${isPro || index < features.length - 2 ? "text-white" : "text-black/70"}`}
                />
              </div>
              <span
                className={`text-base ${isPro || index < features.length - 2 ? "font-medium text-black" : "text-black/80"}`}
              >
                {feature}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <Button
        variant={buttonVariant}
        size="lg"
        className={`relative mt-6 w-full ${
          isPro ? "shadow-lg transition-shadow hover:shadow-xl" : ""
        }`}
        disabled={buttonDisabled}
        onClick={onButtonClick}
      >
        {buttonText}
      </Button>
    </motion.div>
  );
}
