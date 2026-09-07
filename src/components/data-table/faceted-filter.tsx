"use client";

import * as React from "react";

import { CheckIcon, PlusCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Faceted column filter (official shadcn data-table pattern): a popover with
 * a searchable option list plus removable badges for the active selection.
 */
export function FacetedFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: FacetedFilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedSet = new Set(selected);

  const handleSelect = (value: string) => {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircleIcon className="size-3.5" aria-hidden />
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 !h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selected.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                    <div
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className="size-3.5" aria-hidden />
                    </div>
                    {option.icon && <option.icon className="mr-2 size-4 text-muted-foreground" aria-hidden />}
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <span className="ml-auto flex items-center gap-0.5 font-mono text-xs text-muted-foreground">
                        {selected.indexOf(option.value) + 1}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center text-muted-foreground"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
