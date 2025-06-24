
import React, { createContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

const AppThemeProvider = ({ children }) => {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#0D47A1', 
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#1565C0',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
      text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.38)',
      },
      divider: 'rgba(0, 0, 0, 0.12)',
      error: {
        main: '#f44336',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#ff9800',
        contrastText: 'rgba(0, 0, 0, 0.87)',
      },
      info: {
        main: '#29b6f6',
        contrastText: '#ffffff',
      },
      success: {
        main: '#4caf50',
        contrastText: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
        color: '#0D47A1',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        color: '#1565C0',
      },
      button: {
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#0D47A1',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
          },
          containedPrimary: {
            backgroundColor: '#0D47A1',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1565C0',
            },
          },
          outlinedPrimary: {
            borderColor: '#0D47A1',
            color: '#0D47A1',
            '&:hover': {
              backgroundColor: '#e3f2fd',
            },
          },
          textPrimary: {
            color: '#0D47A1',
            '&:hover': {
              backgroundColor: 'rgba(13, 71, 161, 0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            height: '100%',
          },
          body: {
            height: '100%',
            backgroundColor: '#f5f5f5',
            '& #root': {
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
          a: {
            color: '#0D47A1',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{}}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export { AppThemeProvider, ThemeContext };
