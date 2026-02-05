import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Componente wrapper que maneja estilos condicionales según el tema
 * Elimina duplicación de lógica de tema en múltiples componentes
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
 * Variante para contenedores con transición suave de tema
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
 * Componente para texto con tema
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
 * Hook personalizado para obtener clases según tema
 * Útil cuando necesitas lógica más compleja
 */
export function useThemeClasses(lightClasses, darkClasses) {
    const { theme } = useTheme();
    return theme === 'dark' ? darkClasses : lightClasses;
}

export default ThemeAwareLayout;
