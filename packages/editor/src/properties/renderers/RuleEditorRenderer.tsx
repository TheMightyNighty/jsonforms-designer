/**
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 */
import { ControlProps, rankWith, scopeEndsWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useCallback, useRef, useState } from 'react';

import { ShowMoreLess } from '../../core/components/ShowMoreLess';
import {
  configureRuleSchemaValidation,
  getMonacoModelForUri,
} from '../../text-editor/jsonSchemaValidation';

const invalidJsonMessage = 'Not a valid rule JSON.';
const ruleDescription =
  'Define conditions and effects that can dynamically control features of the UI based on data.';

const ruleExample = (
  <div>
    <h3>Example</h3>
    <p>
      A rule that hides the UI Element it is contained in, when the value of
      the control with the scope <b>&apos;#/properties/name&apos;</b> is{' '}
      <b>&apos;foo&apos;</b>:
    </p>
    <pre>
      {JSON.stringify(
        {
          effect: 'HIDE',
          condition: { type: 'LEAF', scope: '#/properties/name', expectedValue: 'foo' },
        },
        null,
        2
      )}
    </pre>
    <p>
      Visit the{' '}
      <a href="https://jsonforms.io/docs/uischema/rules">
        JSON Forms documentation
      </a>{' '}
      for more info.
    </p>
  </div>
);

const isValidRule = (rule: unknown): boolean => {
  if (!rule) return true;
  const r = rule as Record<string, unknown>;
  return !!(r.effect && r.condition);
};

const MODEL_URI = 'json://core/specification/rules.json';

const RuleEditor: React.FC<ControlProps> = (props) => {
  const { data, path, handleChange, errors } = props;
  const [invalidJson, setInvalidJson] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const beforeMount = useCallback((monaco: Monaco) => {
    const uri = monaco.Uri.parse(MODEL_URI);
    configureRuleSchemaValidation(monaco, uri);
  }, []);

  const onMount = useCallback<OnMount>((editor, monaco) => {
    editorRef.current = editor;
    const uri = monaco.Uri.parse(MODEL_URI);
    const model = getMonacoModelForUri(monaco, uri, JSON.stringify(data, null, 2));
    if (!model.isDisposed()) {
      editor.setModel(model);
    }
  }, [data]);

  const onSubmitRule = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const value = editor.getValue();
      const rule = value ? JSON.parse(value) : undefined;
      if (isValidRule(rule)) {
        setInvalidJson(false);
        handleChange(path, rule);
      } else {
        setInvalidJson(true);
      }
    } catch {
      setInvalidJson(true);
    }
  }, [handleChange, path]);

  const isValid = errors.length === 0 && !invalidJson;

  return (
    <Accordion defaultExpanded={!!data}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Rule</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div style={{ width: '100%' }}>
          <FormHelperText error={false}>{ruleDescription}</FormHelperText>
          <ShowMoreLess style={{ paddingBottom: "16px" }}>
            <FormHelperText error={false}>{ruleExample}</FormHelperText>
          </ShowMoreLess>
          <Editor
            language="json"
            height={200}
            beforeMount={beforeMount}
            onMount={onMount}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              automaticLayout: true,
            }}
          />
          <Grid container direction="row" spacing={2} alignItems="center">
            <Grid>
              <Button variant="contained" onClick={onSubmitRule}>
                Apply
              </Button>
            </Grid>
            <Grid size="grow">
              <FormHelperText error hidden={isValid}>
                {errors.length !== 0 ? errors : invalidJsonMessage}
              </FormHelperText>
            </Grid>
          </Grid>
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

export const RuleEditorRendererRegistration = {
  tester: rankWith(100, scopeEndsWith('rule')),
  renderer: withJsonFormsControlProps(RuleEditor),
};
