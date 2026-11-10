import { cn } from "@/lib/utils";

export function ShinyText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block animate-shiny bg-clip-text text-transparent",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 60%)",
        backgroundSize: "200% 100%",
        backgroundColor: "#8e8e99",
        WebkitBackgroundClip: "text",
      }}
    >
      {text}
    </span>
  );
}
