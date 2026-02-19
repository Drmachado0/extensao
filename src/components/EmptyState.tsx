import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon: Icon, title, description, action, secondaryAction }, ref) => {
    return (
      <div
        ref={ref}
        className="flex flex-col items-center justify-center py-14 gap-4"
        role="status"
        aria-live="polite"
        aria-label={title}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 ring-2 ring-muted/30">
          <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {(action || secondaryAction) && (
          <div className="flex gap-2 mt-2">
            {action && (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={action.onClick}
                aria-label={action.label}
              >
                {action.icon && <action.icon className="h-3.5 w-3.5" />}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={secondaryAction.onClick}
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";
