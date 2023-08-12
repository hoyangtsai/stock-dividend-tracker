"use client"

import { CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { useState, useRef, useCallback } from "react"

import { Skeleton } from "./ui/skeleton"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

// export type Option = Record<"value" | "label", string> & Record<string, string>

// type AutoCompleteProps = {
//   options: Option[]
//   emptyMessage: string
//   value?: Option
//   onItemSelected?: (value: Option) => void
//   isLoading?: boolean
//   disabled?: boolean
//   placeholder?: string
// }

export const AutoComplete = ({
  options,
  placeholder,
  emptyMessage,
  value,
  onItemSelected,
  disabled,
  isLoading = false,
  onInputValueChange,
}) => {
  const inputRef = useRef(null)

  const [isOpen, setOpen] = useState(false)
  const [selected, setSelected] = useState()
  const [inputValue, setInputValue] = useState(value?.label || "")

  const handleKeyDown = useCallback(
    (event) => {
      const input = inputRef.current
      if (!input) {
        return
      }

      // Keep the options displayed when the user is typing
      if (!isOpen) {
        setOpen(true)
      }

      // This is not a default behaviour of the <input /> field
      if (event.key === "Enter" && input.value !== "") {
        const optionToSelect = options.find((option) => option.label === input.value)
        if (optionToSelect) {
          setSelected(optionToSelect)
          onItemSelected?.(optionToSelect)
        }
      }

      if (event.key === "Escape") {
        input.blur()
      }
    },
    [isOpen, options, onItemSelected]
  )

  const handleBlur = useCallback(() => {
    setOpen(false)
    setInputValue(selected?.label)
  }, [selected])

  const handleInputValueChange = useCallback((value) => {
    setInputValue(value);
    onInputValueChange && onInputValueChange(value);
  }, [onInputValueChange]);

  const handleSelectOption = useCallback(
    (selectedOption) => {
      setInputValue(selectedOption.label)

      console.log('selectedOption :>> ', selectedOption);

      setSelected(selectedOption)
      onItemSelected?.(selectedOption)

      // This is a hack to prevent the input from being focused after the user selects an option
      // We can call this hack: "The next tick"
      setTimeout(() => {
        inputRef?.current?.blur()
      }, 0)
    },
    [onItemSelected]
  )

  return (
    <CommandPrimitive onKeyDown={handleKeyDown}>
      <div>
        <CommandInput
          ref={inputRef}
          value={inputValue}
          onValueChange={isLoading ? undefined : handleInputValueChange}
          onBlur={handleBlur}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="text-base"
        />
      </div>
      <div className="mt-1 relative">
        {isOpen ? (
          <div className="absolute top-0 z-10 w-full rounded-xl bg-stone-50 outline-none animate-in fade-in-0 zoom-in-95">
            <CommandList className="ring-1 ring-slate-200 rounded-lg">
              {isLoading ? (
                <CommandPrimitive.Loading>
                  <div className="p-1">
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CommandPrimitive.Loading>
              ) : null}
              {options.length > 0 && !isLoading ? (
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = selected?.value === option.value
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onSelect={() => handleSelectOption(option)}
                        className={cn("flex items-center gap-2 w-full", !isSelected ? "pl-8" : null)}
                      >
                        {isSelected ? <Check className="w-4" /> : null}
                        {option.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null}
              {!isLoading ? (
                <CommandPrimitive.Empty className="select-none rounded-sm px-2 py-3 text-sm text-center">
                  {emptyMessage}
                </CommandPrimitive.Empty>
              ) : null}
            </CommandList>
          </div>
        ) : null}
      </div>
    </CommandPrimitive>
  )
}