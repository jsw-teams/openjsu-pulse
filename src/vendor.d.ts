declare module 'markdown-it-task-lists' {
  const plugin: (instance: unknown, options?: { enabled?: boolean; label?: boolean; labelAfter?: boolean }) => void;
  export default plugin;
}
