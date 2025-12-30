import { CheckIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

interface PricingCardProps {
  tier: "free" | "pro";
  title: string;
  price: number;
  priceDescription: string;
  description: string;
  features: string[];
  buttonText?: string;
  buttonVariant?: "primary" | "secondary";
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
  const isPro = tier === "pro";
  const featureBaseDelay = isPro ? 0.5 : 0.4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FADE_TRANSITION, delay: animationDelay }}
      className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm"
    >
      <div className="relative flex-1">
        <h2 className="text-3xl font-bold text-black leading-none">{title}</h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-6xl font-bold tracking-tight ${
              isPro ? "gradient-title" : "text-black"
            }`}
          >
            ${price}
          </span>
          <span className="text-lg text-black/50">{priceDescription}</span>
        </div>
        <p className="mt-3 text-base text-black/60">{description}</p>

        <ul className="mt-4 space-y-4">
          {features.map((feature, index) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: featureBaseDelay + index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  isPro
                    ? "bg-linear-to-br/oklch from-[color:var(--accent-cobalt)] to-[color:var(--accent-coral)]"
                    : "bg-black/10"
                }`}
              >
                <CheckIcon
                  className={`size-4 ${isPro ? "text-white" : "text-black/70"}`}
                />
              </div>
              <span
                className={`text-base ${isPro ? "font-medium text-black" : "text-black/80"}`}
              >
                {feature}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      {buttonText && (
        <Button
          variant={buttonVariant || "primary"}
          size="lg"
          className={`relative mt-6 w-full ${
            isPro ? "shadow-lg transition-shadow hover:shadow-xl" : ""
          }`}
          disabled={buttonDisabled}
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      )}
    </motion.div>
  );
}
