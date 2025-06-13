/**
 * Colors based on SAM App Style Guide
 */

const primaryColor = '#FF8800'; // Orange primary color
const successColor = '#00B894'; // Green
const warningColor = '#FDCB6E'; // Yellow
const dangerColor = '#FF7675';  // Red
const backgroundColor = '#F5F6FA'; // Light gray
const textPrimary = '#222B45';
const textSecondary = '#7B8FA1';
const borderColor = '#E5E5E5';
const whiteColor = '#FFFFFF';

export const Colors = {
  light: {
    text: textPrimary,
    textSecondary: textSecondary,
    background: backgroundColor,
    tint: primaryColor,
    icon: textSecondary,
    tabIconDefault: textSecondary,
    tabIconSelected: primaryColor,
    primary: primaryColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    border: borderColor,
    white: whiteColor,
    card: whiteColor,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    tint: primaryColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
    primary: primaryColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    border: '#2E3235',
    white: whiteColor,
    card: '#1E2022',
  },
};
