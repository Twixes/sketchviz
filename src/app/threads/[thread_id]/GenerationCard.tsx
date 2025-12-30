import { motion } from "motion/react";
import type { UserParams } from "@/lib/schemas";
import { GenerationImage } from "./GenerationImage";
import { GenerationParameters } from "./GenerationParameters";

interface Generation {
  id: string;
  input_url: string;
  output_url: string | null;
  user_params: UserParams;
  created_at: string;
}

interface GenerationCardProps {
  generation: Generation;
  index: number;
}

export function GenerationCard({ generation, index }: GenerationCardProps) {
  return (
    <motion.div
      key={generation.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-sm"
    >
      <div className="mb-4">
        <p className="text-sm font-semibold text-black/60">
          Generation {index + 1}
        </p>
        <p className="text-xs text-black/40">
          {new Date(generation.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GenerationImage src={generation.input_url} alt="Input" label="Input" />
        <GenerationImage
          src={generation.output_url}
          alt="Output"
          label="Output"
        />
      </div>

      <GenerationParameters params={generation.user_params} />
    </motion.div>
  );
}
