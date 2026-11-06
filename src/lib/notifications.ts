import { sileo } from 'sileo';

// Keep all update messages on the same themed notification system.
export const toast = {
  success: (title: string, description?: string) => sileo.success({ title, description }),
  error: (description: string) => sileo.error({ title: 'Update could not be completed', description }),
  info: (title: string, description?: string) => sileo.info({ title, description }),
};