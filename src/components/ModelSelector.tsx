import { LightningBoltIcon, RocketIcon } from "@radix-ui/react-icons";
import { useTranslations } from "next-globe-gen";
import { Select, type SelectOption } from "@/lib/components/ui/Select";
import type { Model } from "@/lib/schemas";

export interface ModelOption extends SelectOption<Model> {
  description: string;
}

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "google/gemini-3-pro-image-preview",
    label: "Nano Banana Pro",
    description: "Highest quality (recommended). By Google.",
    icon: RocketIcon,
  },
  {
    value: "google/gemini-2.5-flash-image-preview",
    label: "Nano Banana",
    description: "Faster, but less reliable. By Google.",
    icon: LightningBoltIcon,
  },
];

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const t = useTranslations();

  const modelOptions: ModelOption[] = [
    {
      value: "google/gemini-3-pro-image-preview",
      label: t("model.nanoBananaPro"),
      description: t("model.nanoProDescription"),
      icon: RocketIcon,
    },
    {
      value: "google/gemini-2.5-flash-image-preview",
      label: t("model.nanoBanana"),
      description: t("model.nanoDescription"),
      icon: LightningBoltIcon,
    },
  ];

  return (
    <Select
      label={t("model.label")}
      value={value}
      options={modelOptions}
      onChange={onChange}
    />
  );
}
