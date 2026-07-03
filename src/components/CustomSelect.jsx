import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seç",
  disabled = false,
  className = "",
  typeaheadTimeout = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [typeaheadBuffer, setTypeaheadBuffer] = useState("");
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const typeaheadTimerRef = useRef(null);

  const normalizedTypeaheadBuffer = typeaheadBuffer.toLocaleLowerCase("az");
  const displayedOptions = normalizedTypeaheadBuffer
    ? [
        options[0],
        ...options.slice(1).filter((option) =>
          option.label.toLocaleLowerCase("az").includes(normalizedTypeaheadBuffer)
        ),
        ...options.slice(1).filter(
          (option) =>
            !option.label.toLocaleLowerCase("az").includes(normalizedTypeaheadBuffer)
        ),
      ].filter(Boolean)
    : options;

  const normalizedValue = value == null ? "" : String(value);
  const selectedIndex = displayedOptions.findIndex(
    (option) => String(option.value) === normalizedValue
  );
  const selectedOption = selectedIndex >= 0 ? displayedOptions[selectedIndex] : null;
  const safeActiveIndex =
    activeIndex >= 0 && activeIndex < displayedOptions.length ? activeIndex : 0;

  const resetTypeahead = () => {
    if (typeaheadTimerRef.current) {
      clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = null;
    }
    setTypeaheadBuffer("");
  };

  const updateDropdownPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const gap = 6;
    const viewportPadding = 8;
    const menuHeight = Math.min(240, Math.max(44, options.length * 40));
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const opensAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableHeight = opensAbove ? spaceAbove - gap : spaceBelow - gap;

    setDropdownStyle({
      left: `${rect.left}px`,
      top: `${
        opensAbove ? Math.max(viewportPadding, rect.top - menuHeight - gap) : rect.bottom + gap
      }px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.max(44, Math.min(menuHeight, availableHeight))}px`,
    });
  }, [options.length]);

  const closeDropdown = () => {
    resetTypeahead();
    setIsOpen(false);
  };

  const openDropdown = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    updateDropdownPosition();
    setIsOpen(true);
  };

  const selectOption = (option) => {
    if (disabled || !option) return;
    onChange(option.value);
    closeDropdown();
  };

  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const handlePointerDown = (event) => {
      if (
        rootRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }

      closeDropdown();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectedIndex, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;
    dropdownRef.current
      ?.querySelector(".custom-select-option.active")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current);
      }
    },
    []
  );

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (
      typeaheadTimeout > 0 &&
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      if (!isOpen) openDropdown();
      setTypeaheadBuffer((current) => `${current}${event.key}`);
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(resetTypeahead, typeaheadTimeout);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      selectOption(displayedOptions[safeActiveIndex]);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      setActiveIndex((current) => Math.min(current + 1, displayedOptions.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
  };

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className="custom-select-menu"
          style={dropdownStyle}
          role="listbox"
        >
          {displayedOptions.map((option, index) => {
            const isSelected = String(option.value) === normalizedValue;
            const isActive = index === safeActiveIndex;

            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                className={[
                  "custom-select-option",
                  isSelected ? "selected" : "",
                  isActive ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={rootRef}
      className={["custom-select", className, isOpen ? "open" : "", disabled ? "disabled" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        ref={buttonRef}
        type="button"
        className="custom-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="custom-select-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {dropdown}
    </div>
  );
}

export default CustomSelect;
