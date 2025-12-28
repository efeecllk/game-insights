import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f23' },
        { name: 'card', value: '#1a1a2e' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
