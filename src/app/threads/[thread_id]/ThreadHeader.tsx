import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button } from "@/lib/components/ui/Button";

interface ThreadHeaderProps {
  title: string;
  createdAt: string;
  onBackClick: () => void;
}

export function ThreadHeader({
  title,
  createdAt,
  onBackClick,
}: ThreadHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onBackClick}
          leftIcon={<ArrowLeftIcon />}
        >
          Back to threads
        </Button>
      </div>

      <div>
        <h1 className="text-4xl font-semibold text-black">{title}</h1>
        <p className="mt-2 text-lg text-black/70">
          {new Date(createdAt).toLocaleString()}
        </p>
      </div>
    </>
  );
}
