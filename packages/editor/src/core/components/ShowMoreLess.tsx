/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * Migrated: @material-ui -> @mui/material
 * ---------------------------------------------------------------------
 */
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import React, { useState } from 'react';

export interface ShowMoreLessProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const ShowMoreLess: React.FC<ShowMoreLessProps> = ({ className, children }) => {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className={className}>
      <Collapse in={showMore}>{children}</Collapse>
      <Button size="small" onClick={() => setShowMore((s) => !s)}>
        {showMore ? 'Show Less' : 'Show More'}
      </Button>
    </div>
  );
};
