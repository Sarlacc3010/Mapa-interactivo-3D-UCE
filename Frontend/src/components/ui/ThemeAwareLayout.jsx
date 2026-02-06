import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Wrapper component that handles conditional styles based on theme
 * Eliminates theme logic duplication in multiple components
 */
export function ThemeAwareLayout({
    lightClasses = "",
    darkClasses = "",
    children,
    as: Component = "div",
    ...props
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const classes = isDark ? darkClasses : lightClasses;

    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    );
}

/**
 * Variant for containers with smooth theme transition
 */
export function ThemeContainer({
    lightClasses = "",
    darkClasses = "",
    children,
    className = "",
    ...props
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const themeClasses = isDark ? darkClasses : lightClasses;
    const combinedClasses = `${themeClasses} ${className} transition-colors duration-200`;

    return (
        <div className={combinedClasses} {...props}>
            {children}
        </div>
    );
}

/**
 * Component for themed text
 */
export function ThemeText({
    lightColor = "text-gray-800",
    darkColor = "text-white",
    children,
    className = "",
    as: Component = "span",
    ...props
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const colorClass = isDark ? darkColor : lightColor;
    const combinedClasses = `${colorClass} ${className} transition-colors duration-200`;

    return (
        <Component className={combinedClasses} {...props}>
            {children}
        </Component>
    );
}

/**
 * Custom hook to get classes by theme
 * Useful when you need more complex logic
 */
export function useThemeClasses(lightClasses, darkClasses) {
    const { theme } = useTheme();
    return theme === 'dark' ? darkClasses : lightClasses;
}

export default ThemeAwareLayout;
