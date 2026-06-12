import React, { createContext, useContext } from 'react';

import { EditorConfig, mergeEditorConfig } from './editorConfig';

const EditorConfigContext = createContext<EditorConfig>(mergeEditorConfig());

interface EditorConfigProviderProps {
  config?: EditorConfig;
  children: React.ReactNode;
}

export function EditorConfigProvider({
  config,
  children,
}: EditorConfigProviderProps) {
  const merged = React.useMemo(() => mergeEditorConfig(config), [config]);
  return (
    <EditorConfigContext.Provider value={merged}>
      {children}
    </EditorConfigContext.Provider>
  );
}

export function useEditorConfig(): EditorConfig {
  return useContext(EditorConfigContext);
}
