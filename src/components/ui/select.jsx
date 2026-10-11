"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// On phones the select opens as a bottom sheet drawer instead of a popper.
// Everything below is opt-in through this context: on desktop the components
// render exactly the same Radix primitives as before.
const SelectContext = React.createContext(null);

// Radix tracks the selected item's label in its own internal registry, which the
// drawer does not use, so the options are read straight off the children instead.
function collectOptions(children, options = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      options.push({ value: child.props.value, label: child.props.children });
      return;
    }
    if (child.props && child.props.children) {
      collectOptions(child.props.children, options);
    }
  });
  return options;
}

const Select = ({ children, value, defaultValue, onValueChange, ...props }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const options = collectOptions(children);

  if (!isMobile) {
    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        {...props}>
        {children}
      </SelectPrimitive.Root>
    );
  }

  return (
    <SelectContext.Provider
      value={{ isMobile: true, open, setOpen, value, defaultValue, options, onValueChange }}>
      <DrawerPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </DrawerPrimitive.Root>
    </SelectContext.Provider>
  );
};
Select.displayName = "Select";

const SelectGroup = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (ctx?.isMobile) {
    return (
      <div ref={ref} className={cn("py-1", className)} {...props}>
        {children}
      </div>
    );
  }
  return (
    <SelectPrimitive.Group ref={ref} className={className} {...props}>
      {children}
    </SelectPrimitive.Group>
  );
});
SelectGroup.displayName = SelectPrimitive.Group.displayName;

const SelectValue = ({ className, placeholder, children, ...props }) => {
  const ctx = React.useContext(SelectContext);

  if (ctx?.isMobile) {
    const selected = ctx.options.find(
      (o) => String(o.value) === String(ctx.value ?? ctx.defaultValue ?? "")
    );
    const label = children ?? selected?.label;
    const hasLabel = label !== undefined && label !== null && label !== "";
    return (
      <span
        className={cn("line-clamp-1 text-left", !hasLabel && "text-slate-400", className)}
        {...props}>
        {hasLabel ? label : placeholder}
      </span>
    );
  }

  return (
    <SelectPrimitive.Value className={className} placeholder={placeholder} {...props}>
      {children}
    </SelectPrimitive.Value>
  );
};
SelectValue.displayName = "SelectValue";

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);

  if (ctx?.isMobile) {
    return (
      <button
        type="button"
        ref={ref}
        onClick={() => ctx.setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...props}>
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    );
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (ctx?.isMobile) return null;
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}>
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (ctx?.isMobile) return null;
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}>
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(
  ({ className, children, position = "popper", ...props }, ref) => {
    const ctx = React.useContext(SelectContext);

    if (ctx?.isMobile) {
      return (
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
          <DrawerPrimitive.Content
            ref={ref}
            aria-describedby={undefined}
            className={cn(
              className,
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-slate-700 bg-slate-900 text-white shadow-2xl outline-none"
            )}>
            <DrawerPrimitive.Title className="sr-only">Choose an option</DrawerPrimitive.Title>
            <div className="mx-auto mt-3 h-1.5 w-[100px] shrink-0 rounded-full bg-slate-600" />
            <div className="mt-2 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {children}
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      );
    }

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className
          )}
          position={position}
          {...props}>
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport className="bg-slate-700 p-1 h-full max-h-60 w-full min-w-[var(--radix-select-trigger-width)]">
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  }
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (ctx?.isMobile) {
    return (
      <div
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold text-slate-400", className)}
        {...props} />
    );
  }
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props} />
  );
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);

  if (ctx?.isMobile) {
    const selected =
      String(props.value) === String(ctx.value ?? ctx.defaultValue ?? "");
    return (
      <button
        type="button"
        ref={ref}
        disabled={props.disabled}
        onClick={() => {
          if (ctx.onValueChange) ctx.onValueChange(props.value);
          ctx.setOpen(false);
        }}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm text-white active:bg-slate-700 disabled:opacity-50",
          selected && "bg-slate-800 font-medium",
          className
        )}>
        <span className="flex-1">{children}</span>
        {selected && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
      </button>
    );
  }

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (ctx?.isMobile) {
    return <div ref={ref} className={cn("my-1 h-px bg-slate-700", className)} {...props} />;
  }
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props} />
  );
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton };