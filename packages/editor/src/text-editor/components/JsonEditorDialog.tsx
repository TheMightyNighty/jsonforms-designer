/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { TransitionProps } from '@mui/material/transitions';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useCallback, useMemo } from 'react';

import {
  configureJsonSchemaValidation,
  getMonacoModelForUri,
  TextType,
} from '../jsonSchemaValidation';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Fade ref={ref} {...props} />;
});
Transition.displayName = 'FadeTransition';

interface JsonEditorDialogProps {
  open: boolean;
  title: string;
  initialContent: unknown;
  type: TextType;
  onApply: (newContent: unknown) => void;
  onCancel: () => void;
}

export const JsonEditorDialog: React.FC<JsonEditorDialogProps> = ({
  open,
  title,
  initialContent,
  type,
  onApply,
  onCancel,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelUri = useMemo(() => {
    // Uri is accessed via the monaco instance at beforeMount time
    return 'json://core/specification/schema.json';
  }, []);

  // beforeMount replaces editorWillMount: configure JSON schema validation
  const handleBeforeMount = useCallback(
    (monaco: Monaco) => {
      const uri = monaco.Uri.parse(modelUri);
      if (type === 'JSON Schema') {
        configureJsonSchemaValidation(monaco, uri);
      }
    },
    [type, modelUri]
  );

  // Memoize initial value
  const initialValue = useMemo(
    () =>
      initialContent !== undefined
        ? JSON.stringify(initialContent, null, 2)
        : '',
    [initialContent]
  );

  // onMount replaces editorDidMount: set model and focus
  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      const uri = monaco.Uri.parse(modelUri);
      const model = getMonacoModelForUri(monaco, uri, initialValue);
      if (!model.isDisposed()) {
        editor.setModel(model);
      }
      editor.focus();
    },
    [modelUri, initialValue]
  );

  // Get value from editor on apply — type extracted from OnMount signature
  type EditorInstance = Parameters<OnMount>[0];
  const editorRef = React.useRef<EditorInstance | null>(null);
  const onMountWithRef = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;
      handleMount(editor, monaco);
    },
    [handleMount]
  );

  const handleApply = useCallback(() => {
    if (editorRef.current) {
      const raw = editorRef.current.getValue();
      try {
        onApply(JSON.parse(raw));
      } catch {
        onApply(raw);
      }
    }
  }, [onApply]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          height: '100%',
          minHeight: '95vh',
          maxHeight: '95vh',
        },
      }}
      maxWidth="lg"
      fullWidth
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onCancel}
            aria-label="cancel"
            data-cy="cancel"
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="h6"
            color="inherit"
            noWrap
            sx={{ marginLeft: 2, flex: 1 }}
          >
            {title} Text Edit
          </Typography>
          <Button variant="contained" onClick={handleApply} data-cy="apply">
            Apply
          </Button>
        </Toolbar>
      </AppBar>
      <DialogContent
        sx={{ overflow: 'hidden', marginTop: 2, flex: 1 }}
      >
        <Editor
          language="json"
          height="100%"
          beforeMount={handleBeforeMount}
          onMount={onMountWithRef}
        />
      </DialogContent>
    </Dialog>
  );
};
