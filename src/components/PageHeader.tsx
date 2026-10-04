import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl dark:bg-black/90">
      <div className="flex items-end justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] lg:px-8 lg:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
