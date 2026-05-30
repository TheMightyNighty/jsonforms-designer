/**
 * ErrorBoundary für den Editor — fängt Render-Fehler ab
 * und zeigt statt White Screen eine Fehlermeldung.
 */
import { Box, Button, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallbackLabel?: string; }
interface State { hasError: boolean; error: string; }

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[JSONForms Designer]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          p: 2, border: '1px solid', borderColor: 'error.light',
          borderRadius: 1, backgroundColor: 'error.50',
        }}>
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, display: 'block' }}>
            {this.props.fallbackLabel ?? 'Render-Fehler'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.65rem' }}>
            {this.state.error}
          </Typography>
          <Button size="small" sx={{ mt: 0.5 }} onClick={() => this.setState({ hasError: false, error: '' })}>
            Neu laden
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
