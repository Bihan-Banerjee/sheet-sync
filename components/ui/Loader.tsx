import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({ text = "Loading...", fullScreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-text-dim">
      {/* The animate-spin class handles the rotation smoothly */}
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm font-medium animate-pulse">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[250px]">
      {content}
    </div>
  );
}