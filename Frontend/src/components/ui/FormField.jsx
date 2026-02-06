import React from 'react';
import { Input, Label } from './shim';

/**
 * Reusable component for form fields with validation
 * Reduces duplication in LoginScreen and other forms
 */
export function FormField({
    label,
    type = "text",
    value,
    onChange,
    error = null,
    required = false,
    placeholder = "",
    icon: Icon = null,
    className = "",
    ...props
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <Label className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}

                <Input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    className={`
            bg-white dark:bg-gray-800 
            border-gray-300 dark:border-gray-600 
            text-gray-900 dark:text-white 
            focus:border-blue-500 dark:focus:border-blue-400
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>

            {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * Selection field (dropdown) with the same style
 */
export function SelectField({
    label,
    value,
    onChange,
    options = [],
    error = null,
    required = false,
    placeholder = "-- Seleccionar --",
    icon: Icon = null,
    className = "",
    ...props
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <Label className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                        <Icon size={18} />
                    </div>
                )}

                <select
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`
            w-full py-2.5 px-3 text-sm
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 
            text-gray-900 dark:text-white 
            rounded-lg 
            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            focus:border-blue-500 dark:focus:border-blue-400
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
                    {...props}
                >
                    <option value="" className="text-gray-400">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}

export default FormField;
