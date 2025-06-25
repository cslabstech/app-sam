import React from 'react';
import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/utils/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export const ThemedText = React.memo(function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const getTextClasses = () => {
    switch (type) {
      case 'title':
        return 'text-3xl font-bold leading-8 text-neutral-900 dark:text-white';
      case 'subtitle':
        return 'text-xl font-bold text-neutral-900 dark:text-white';
      case 'defaultSemiBold':
        return 'text-base leading-6 font-semibold text-neutral-900 dark:text-white';
      case 'link':
        return 'text-base leading-8 text-primary-500 underline';
      case 'default':
      default:
        return 'text-base leading-6 text-neutral-900 dark:text-white';
    }
  };

  const textClasses = getTextClasses();

  return (
    <Text
      className={textClasses}
      style={[
        (lightColor || darkColor) && { color },
        style,
      ]}
      {...rest}
    />
  );
});

// 4. Types already exported above
