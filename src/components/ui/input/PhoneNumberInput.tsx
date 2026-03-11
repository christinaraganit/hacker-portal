'use client';

import { cn } from '@/lib/utils';
import {
    CSSProperties,
    forwardRef,
    useCallback,
    useRef,
    useState,
} from 'react';
import style from './input.module.css';
import { Input } from './input';

/**
 * Formats a string of digits into a North American phone number format.
 * - 10 digits: (XXX) XXX-XXXX
 * - 11 digits starting with 1: 1 (XXX) XXX-XXXX
 */
function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return '';

    if (digits[0] === '1') {
        if (digits.length <= 1) return '1';
        if (digits.length <= 4) return `1 (${digits.slice(1)}`;
        if (digits.length <= 7)
            return `1 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
        return `1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }

    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Strips all non-digit characters from a string.
 */
function stripNonDigits(value: string): string {
    return value.replace(/\D/g, '');
}

interface PhoneNumberInputProps {
    name?: string;
    defaultValue?: string;
    onValueChange?: (rawDigits: string) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    errorMsg?: string;
    className?: string;
}

export const PhoneNumberInput = forwardRef<
    HTMLInputElement,
    PhoneNumberInputProps
>(
    (
        {
            name,
            defaultValue = '',
            onValueChange,
            required,
            disabled,
            placeholder = '(604) 862-2113',
            errorMsg = 'Not a valid phone number',
            className,
        },
        ref
    ) => {
        const [displayValue, setDisplayValue] = useState(() =>
            formatPhoneNumber(defaultValue)
        );
        const inputRef = useRef<HTMLInputElement | null>(null);

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const input = e.target;
                const rawInput = input.value;
                const cursorPos = input.selectionStart || 0;

                // Count how many digits are before the cursor in the current input
                const digitsBeforeCursor = stripNonDigits(
                    rawInput.slice(0, cursorPos)
                ).length;

                const digits = stripNonDigits(rawInput);
                const maxDigits = digits.startsWith('1') ? 11 : 10;
                const trimmedDigits = digits.slice(0, maxDigits);
                const formatted = formatPhoneNumber(trimmedDigits);

                setDisplayValue(formatted);
                onValueChange?.(trimmedDigits);

                // Restore cursor position based on digit count
                requestAnimationFrame(() => {
                    if (!input) return;
                    let newPos = 0;
                    let digitCount = 0;
                    for (let i = 0; i < formatted.length; i++) {
                        if (/\d/.test(formatted[i])) {
                            digitCount++;
                            if (digitCount === digitsBeforeCursor) {
                                newPos = i + 1;
                                break;
                            }
                        }
                    }
                    if (digitCount < digitsBeforeCursor)
                        newPos = formatted.length;
                    input.setSelectionRange(newPos, newPos);
                });
            },
            [onValueChange]
        );

        const rawDigits = stripNonDigits(displayValue);

        return (
            <div
                style={
                    {
                        '--errorMsg': `"${errorMsg}"`,
                    } as CSSProperties
                }
                className={cn(style.inputHolder, {
                    [style.hasError]: required,
                })}
            >
                <div className="relative flex items-center">
                    <Input
                        type="tel"
                        value={displayValue}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        pattern={'(1 )?\\([2-9]\\d{2}\\) [2-9]\\d{2}-\\d{4}'}
                        className={cn(style.textinput, 'truncate', className)}
                        ref={(node) => {
                            inputRef.current = node;
                            if (typeof ref === 'function') {
                                ref(node);
                            } else if (ref) {
                                ref.current = node;
                            }
                        }}
                    />
                </div>
                {name && <input type="hidden" name={name} value={rawDigits} />}
            </div>
        );
    }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';
