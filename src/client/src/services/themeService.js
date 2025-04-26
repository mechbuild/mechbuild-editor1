const colors = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  muted: '#6c757d'
};

const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem'
};

const breakpoints = {
  xs: '0px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px'
};

const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    small: '0.875rem',
    base: '1rem',
    large: '1.25rem',
    h1: '2.5rem',
    h2: '2rem',
    h3: '1.75rem',
    h4: '1.5rem'
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    loose: 2
  }
};

const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
};

const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
  slow: 'all 0.45s ease'
};

const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  full: '9999px'
};

const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060
};

class ThemeService {
  static colors = colors;
  static spacing = spacing;
  static breakpoints = breakpoints;
  static typography = typography;
  static shadows = shadows;
  static transitions = transitions;
  static borderRadius = borderRadius;
  static zIndex = zIndex;

  static getResponsiveStyle(styles) {
    return Object.keys(styles).reduce((acc, breakpoint) => {
      if (breakpoint === 'base') {
        return { ...acc, ...styles[breakpoint] };
      }
      
      const minWidth = this.breakpoints[breakpoint];
      if (!minWidth) return acc;

      return {
        ...acc,
        [`@media (min-width: ${minWidth})`]: styles[breakpoint]
      };
    }, {});
  }

  static getButtonStyle(variant = 'primary', size = 'md') {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${this.spacing.sm} ${this.spacing.md}`,
      fontSize: this.typography.fontSize.base,
      fontWeight: this.typography.fontWeight.medium,
      lineHeight: this.typography.lineHeight.normal,
      textAlign: 'center',
      textDecoration: 'none',
      verticalAlign: 'middle',
      cursor: 'pointer',
      userSelect: 'none',
      border: 'none',
      borderRadius: this.borderRadius.md,
      transition: this.transitions.default
    };

    const variantStyles = {
      primary: {
        backgroundColor: this.colors.primary,
        color: this.colors.white,
        '&:hover': {
          backgroundColor: '#0056b3'
        }
      },
      secondary: {
        backgroundColor: this.colors.secondary,
        color: this.colors.white,
        '&:hover': {
          backgroundColor: '#545b62'
        }
      }
    };

    const sizeStyles = {
      sm: {
        padding: `${this.spacing.xs} ${this.spacing.sm}`,
        fontSize: this.typography.fontSize.small
      },
      lg: {
        padding: `${this.spacing.md} ${this.spacing.lg}`,
        fontSize: this.typography.fontSize.large
      }
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size]
    };
  }
}

export default ThemeService; 