import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Box,
  Divider,
  Stack,
  TextField,
  Modal,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Person,
  Cake,
  Female,
  Male,
  Phone,
  Healing,
  Restaurant,
  Warning,
  Description,
  Edit,
  Delete,
  Search,
  Event,
  Home,
  LocalHospital,
  Medication
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const ResidentCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
  }
}));

const ResidentAvatar = styled(Avatar)(({ theme, gender }) => ({
  width: 72,
  height: 72,
  border: `3px solid ${gender === 'female' ? theme.palette.error.light : theme.palette.primary.light}`,
  boxShadow: theme.shadows[2]
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1)
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(0.75)
}));

const MedicalItem = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
  borderRadius: '8px',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1)
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: theme.spacing(1)
}));

function calculateAge(dob) {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const ViewResidents = () => {
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [fileMeta, setFileMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const navigate = useNavigate();

  const fetchResidents = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    
    axios.get('http://localhost:3000/residents', {
      headers: { Authorization: token }
    })
    .then((res) => {
      setResidents(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setSnackbar({
          open: true,
          message: 'Session expired. Please login again.',
          severity: 'error'
        });
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view residents.');
        setSnackbar({
          open: true,
          message: 'You do not have permission to view residents.',
          severity: 'error'
        });
      } else {
        setError('Failed to load residents. Please try again later.');
        setSnackbar({
          open: true,
          message: 'Failed to load residents. Please try again later.',
          severity: 'error'
        });
      }
    });
  };

  useEffect(() => { 
    fetchResidents(); 
  }, []);

  const deleteResident = (id) => {
    const token = localStorage.getItem("token");
    axios.delete(`http://localhost:3000/residents/${id}`, {
      headers: { Authorization: token },
    })
    .then((res) => {
      setSnackbar({
        open: true,
        message: 'Resident deleted successfully',
        severity: 'success'
      });
      setResidents((prev) => prev.filter((res) => res._id !== id));
    })
    .catch((err) => {
      console.error(err);
      setSnackbar({
        open: true,
        message: 'Failed to delete resident',
        severity: 'error'
      });
    });
  };

  const updateResident = (val) => {
    const residentData = {
      ...val,
      diseases: Array.isArray(val.diseases) 
        ? val.diseases.map(disease => ({
            name: typeof disease === 'string' ? disease : disease.name,
            medicines: typeof disease === 'string' 
              ? val.medicines?.filter(med => 
                  med.name.toLowerCase().includes(disease.toLowerCase())) || []
              : disease.medicines || []
          }))
        : [{ name: '', medicines: [] }],
      existingDocument: val.document,
      existingPhoto: val.photo,
      dob: val.dob,
      admissionDate: val.admissionDate
    };
    navigate('/add', { state: { val: residentData } });
  };

  const handlePreview = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const url = `http://localhost:3000/uploads/${fileName}`;

    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      setPreviewSrc(url);
      setOpenPreview(true);
    } else if (ext === 'pdf') {
      window.open(url, '_blank');
    } else {
      setSnackbar({
        open: true,
        message: 'Preview not supported for this file type. Please use Download instead.',
        severity: 'info'
      });
    }
  };

  const handleDownload = (fileName, residentName) => {
    const url = `http://localhost:3000/uploads/${fileName}`;
    const extension = fileName.split('.').pop();
    const cleanName = residentName.replace(/\s+/g, '_').toLowerCase();

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        const size = res.headers.get('content-length');
        const type = res.headers.get('content-type');
        setFileMeta({ [fileName]: { size, type } });
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `document_of_${cleanName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        console.error('Download failed:', err);
        setSnackbar({
          open: true,
          message: 'Failed to download document',
          severity: 'error'
        });
      });
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setPreviewSrc('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ 
        mb: 4,
        fontWeight: 700,
        color: 'primary.main',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        mt: -12
      }}>
        Resident Profiles
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        mb: 4
      }}>
        <TextField
          label="Search residents"
          variant="outlined"
          sx={{ width: '100%', maxWidth: '600px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            sx: { borderRadius: '50px', backgroundColor: 'background.paper' }
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '300px'
        }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <Warning color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={fetchResidents}
          >
            Retry
          </Button>
        </Box>
      ) : filteredResidents.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <Warning color="action" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            {searchTerm ? 'No residents match your search' : 'No residents found'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} columns={{ xs: 1, sm: 2, md: 3 }}>
          {filteredResidents.map((resident, index) => (
            <Grid item key={index} xs={1} sm={1} md={1}>
              <ResidentCard>
                <CardContent sx={{ p: 3 }}>
                  {/* Header Section */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2 
                  }}>
                    <ResidentAvatar
                      gender={resident.gender}
                      src={resident.photo ? `http://localhost:3000/uploads/${resident.photo}` : '/default-avatar.jpg'}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        color: 'primary.dark',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Person fontSize="small" />
                        {resident.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          icon={<Cake fontSize="small" />}
                          label={`${calculateAge(resident.dob)} years`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        <Chip 
                          icon={resident.gender === 'female' ? 
                            <Female fontSize="small" /> : 
                            <Male fontSize="small" />}
                          label={resident.gender || 'N/A'}
                          size="small"
                          color={resident.gender === 'female' ? 'error' : 'primary'}
                          variant="outlined"
                        />
                        <Chip 
                          icon={<Home fontSize="small" />}
                          label={`Room ${resident.room || 'N/A'}`}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Key Information */}
                  <Box sx={{ mb: 3 }}>
                    <InfoRow>
                      <Phone color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Emergency:</strong> {resident.emergencyContact || 'Not provided'}
                      </Typography>
                    </InfoRow>
                    
                    <InfoRow>
                      <Event color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Admitted:</strong> {resident.admissionDate ? 
                          new Date(resident.admissionDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </InfoRow>
                    
                    <InfoRow>
                      <LocalHospital color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>History:</strong> {resident.history || 'No medical history'}
                      </Typography>
                    </InfoRow>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Dietary Restrictions */}
                  <Box sx={{ mb: 2 }}>
                    <SectionTitle variant="subtitle2">
                      <Restaurant fontSize="small" />
                      Dietary Restrictions
                    </SectionTitle>
                    {resident.dietary && resident.dietary.trim() !== '' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {resident.dietary.split(',').map((item, i) => (
                          <Chip 
                            key={i}
                            label={item.trim()}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        No dietary restrictions
                      </Typography>
                    )}
                  </Box>

                  {/* Medical Conditions */}
                  <Box sx={{ mb: 2 }}>
                    <SectionTitle variant="subtitle2">
                      <Healing fontSize="small" />
                      Medical Conditions
                    </SectionTitle>
                    {(resident.diseases || []).length > 0 ? (
                      <Box>
                        {(resident.diseases || []).map((disease, i) => (
                          <MedicalItem key={i}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {typeof disease === 'string' ? disease : disease.name}
                            </Typography>
                            {(Array.isArray(disease.medicines) ? disease.medicines : 
                              (resident.medicines || []).filter(m => 
                                typeof disease === 'string' ? 
                                m.name.toLowerCase().includes(disease.toLowerCase()) :
                                m.name.toLowerCase().includes(disease.name.toLowerCase())
                              )).map((med, j) => (
                              <InfoRow key={j}>
                                <Medication color="secondary" fontSize="small" />
                                <Typography variant="body2">
                                  {med.name} ({med.dosage} - {med.frequency})
                                </Typography>
                              </InfoRow>
                            ))}
                          </MedicalItem>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        No medical conditions reported
                      </Typography>
                    )}
                  </Box>

                  {/* Allergies */}
                  <Box sx={{ mb: 2 }}>
                    <SectionTitle variant="subtitle2">
                      <Warning fontSize="small" />
                      Allergies
                    </SectionTitle>
                    {resident.allergies && resident.allergies.trim() !== '' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {resident.allergies.split(',').map((allergy, i) => (
                          <Chip 
                            key={i}
                            label={allergy.trim()}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        No known allergies
                      </Typography>
                    )}
                  </Box>

                  {/* Documents */}
                  {resident.document && (
                    <Box sx={{ mb: 2 }}>
                      <SectionTitle variant="subtitle2">
                        <Description fontSize="small" />
                        Documents
                      </SectionTitle>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Preview document">
                          <IconButton
                            color="info"
                            onClick={() => handlePreview(resident.document)}
                            size="small"
                          >
                            <Description />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download document">
                          <IconButton
                            color="primary"
                            onClick={() => handleDownload(resident.document, resident.name)}
                            size="small"
                          >
                            <Description />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  )}

                  {/* Actions */}
                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <ActionButton
                      variant="contained"
                      color="error"
                      fullWidth
                      startIcon={<Delete />}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this resident?')) {
                          deleteResident(resident._id);
                        }
                      }}
                    >
                      Delete
                    </ActionButton>
                    <ActionButton
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<Edit />}
                      onClick={() => updateResident(resident)}
                    >
                      Edit
                    </ActionButton>
                  </Stack>
                </CardContent>
              </ResidentCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Document Preview Modal */}
      <Modal open={openPreview} onClose={handleClosePreview}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
          outline: 'none',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <img
            src={previewSrc}
            alt="Document Preview"
            style={{ 
              maxWidth: '100%', 
              maxHeight: 'calc(90vh - 100px)',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
          />
          <Button 
            onClick={handleClosePreview} 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Close Preview
          </Button>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewResidents;