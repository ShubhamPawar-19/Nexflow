import type { ComponentProps, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import type { NodeStatus } from "./node-status-indicator";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";

interface BaseNodeProps extends HTMLAttributes<HTMLDivElement> {
  status?: NodeStatus;
}

export function BaseNode({
  className,
  status,
  ...props
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground relative rounded-md border transition-all",
        "hover:bg-accent",
        "in-[.selected]:border-muted-foreground",
        "in-[.selected]:shadow-lg",
        className,
      )}
      tabIndex={0}
      {...props}
    >
      {props.children}
    {status === "error" && (
        <XCircleIcon className="absolute right-0.5 bottom-0.5 
        size-2 text-red-700 stroke-3"/>
      )}
      {status === "success" && (
        <CheckCircle2Icon className="absolute right-0.5 bottom-0.5 
        size-2 text-green-700 stroke-3"/>
      )}
      {status === "loading" && (
        <Loader2Icon className="absolute right-0.5 bottom-0.5 
        size-2 text-blue-700 stroke-3 animate-spin"/>
      )}
      </div>
  );
}

/**
 * Consistent header layout for nodes.
 */
export function BaseNodeHeader({
  className,
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2",
        className,
      )}
    />
  );
}

/**
 * Non-selectable node title.
 */
export function BaseNodeHeaderTitle({
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="base-node-title"
      className={cn("select-none flex-1 font-semibold", className)}
      {...props}
    />
  );
}

export function BaseNodeContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-content"
      className={cn("flex flex-col gap-2 p-3", className)}
      {...props}
    />
  );
}

export function BaseNodeFooter({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-footer"
      className={cn(
        "flex flex-col items-center gap-2 border-t px-3 pt-2 pb-3",
        className,
      )}
      {...props}
    />
  );
}