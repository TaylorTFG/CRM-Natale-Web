import React from 'react';
import { TableCell, Box, Typography, IconButton, Tooltip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SortIcon from '@mui/icons-material/Sort';

// Componente per le celle ordinabili delle tabelle
const SortableTableCell = ({ label, field, orderBy, orderDirection, onRequestSort }) => {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const isActive = orderBy === field;

  return (
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography component="span" variant="inherit" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <Tooltip
          title={isActive ? (orderDirection === 'asc' ? 'Ordina decrescente' : 'Ordina crescente') : 'Ordina'}
        >
          <IconButton 
            size="small" 
            onClick={createSortHandler(field)}
            sx={{ 
              ml: 1, 
              opacity: isActive ? 1 : 0.5,
              '&:hover': { opacity: 1 }
            }}
          >
            {isActive ? (
              orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
            ) : (
              <SortIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  );
};

export default SortableTableCell;