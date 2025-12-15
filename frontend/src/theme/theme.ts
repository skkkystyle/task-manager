import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  
  colors: {
    brand: [
      '#e7f5ff',
      '#d0ebff',
      '#a5d8ff',
      '#74c0fc',
      '#4dabf7',
      '#339af0',
      '#228be6',
      '#1c7ed6',
      '#1971c2',
      '#1864ab',
    ],
  },
  
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier New, monospace',
  headings: {
    fontFamily: 'Greycliff CF, Inter, sans-serif',
    fontWeight: '700',
  },
  
  defaultRadius: 'md',
  
  cursorType: 'pointer',
  
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'sm',
      },
    },
    PasswordInput: {
      defaultProps: {
        size: 'sm',
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
      },
    },
  },
});