import React, { useEffect, useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Paper,
  Chip,
  Stack,
  Avatar,
  Divider,
  IconButton,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Person,
  Cake,
  Female,
  Male,
  Phone,
  Home,
  Event,
  Restaurant,
  LocalHospital,
  Medication,
  Warning,
  Description,
  Add,
  Delete,
  CloudUpload
} from '@mui/icons-material';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 900,
  margin: 'auto',
  marginTop: theme.spacing(-12),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const FormRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(2)
  }
}));

const FormColumn = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `3px solid ${theme.palette.primary.light}`,
  boxShadow: theme.shadows[2]
}));

const UploadButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: theme.spacing(1.5, 3),
  borderRadius: '8px'
}));

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  const pad = n => n < 10 ? '0' + n : n;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const AddResident = () => {
  const [input, setInput] = useState({
    name: '',
    gender: '',
    dob: '',
    admissionDate: '',
    emergencyContact: '',
    history: '',
    room: '',
    dietary: [],
    allergies: '',
    diseases: [{ name: '', medicines: [{ name: '', dosage: '', frequency: '' }] }],
    document: null,
    existingDocument: null,
    photo: null,
    existingPhoto: null,
    _id: null
  });

  const [dietaryInput, setDietaryInput] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.val) {
      const data = location.state.val;
      const diseases = Array.isArray(data.diseases)
        ? data.diseases.map(disease => ({
            name: typeof disease === 'string' ? disease : (disease.name || ''),
            medicines: Array.isArray(disease.medicines)
              ? disease.medicines
              : (Array.isArray(data.medicines)
                ? data.medicines.filter(med =>
                    med.name &&
                    (typeof disease === 'string'
                      ? med.name.toLowerCase().includes(disease.toLowerCase())
                      : med.name.toLowerCase().includes((disease.name || '').toLowerCase())
                    )
                  )
                : [{ name: '', dosage: '', frequency: '' }]
              )
          }))
        : [{ name: '', medicines: [{ name: '', dosage: '', frequency: '' }] }];

      setInput({
        name: data.name || '',
        dob: toDateInputValue(data.dob) || '',
        gender: data.gender || '',
        admissionDate: toDateInputValue(data.admissionDate) || '',
        emergencyContact: data.emergencyContact || '',
        history: data.history || '',
        room: data.room || '',
        dietary: Array.isArray(data.dietary) 
          ? data.dietary 
          : (data.dietary ? data.dietary.split(',') : []),
        allergies: data.allergies || '',
        diseases: diseases.length ? diseases : [{ name: '', medicines: [{ name: '', dosage: '', frequency: '' }] }],
        document: null,
        existingDocument: data.document || null,
        photo: null,
        existingPhoto: data.photo || null,
        _id: data._id || null
      });
      
      if (data.photo) {
        setPreviewPhoto(`http://localhost:3000/uploads/${data.photo}`);
      }
    }
  }, [location.state]);

  const inputHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInput({ ...input, photo: file });
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDietaryAdd = () => {
    if (dietaryInput.trim() !== '') {
      setInput({
        ...input,
        dietary: [...input.dietary, dietaryInput.trim()]
      });
      setDietaryInput('');
    }
  };

  const handleDietaryRemove = (index) => {
    const newDietary = [...input.dietary];
    newDietary.splice(index, 1);
    setInput({ ...input, dietary: newDietary });
  };

  const handleDiseaseChange = (index, value) => {
    const updated = [...input.diseases];
    updated[index].name = value;
    setInput({ ...input, diseases: updated });
  };

  const addDiseaseField = () => {
    setInput({
      ...input,
      diseases: [...input.diseases, { name: '', medicines: [{ name: '', dosage: '', frequency: '' }] }]
    });
  };

  const handleMedicineChange = (diseaseIndex, medIndex, field, value) => {
    const updatedDiseases = [...input.diseases];
    updatedDiseases[diseaseIndex].medicines[medIndex][field] = value;
    setInput({ ...input, diseases: updatedDiseases });
  };

  const addMedicineField = (diseaseIndex) => {
    const updatedDiseases = [...input.diseases];
    updatedDiseases[diseaseIndex].medicines.push({ name: '', dosage: '', frequency: '' });
    setInput({ ...input, diseases: updatedDiseases });
  };

  const removeDiseaseField = (diseaseIndex) => {
    const updatedDiseases = [...input.diseases];
    updatedDiseases.splice(diseaseIndex, 1);
    setInput({
      ...input,
      diseases: updatedDiseases.length ? updatedDiseases : [{ name: '', medicines: [{ name: '', dosage: '', frequency: '' }] }]
    });
  };

  const removeMedicineField = (diseaseIndex, medIndex) => {
    const updatedDiseases = [...input.diseases];
    updatedDiseases[diseaseIndex].medicines.splice(medIndex, 1);
    setInput({ ...input, diseases: updatedDiseases });
  };

  const submitHandler = () => {
    const id = input._id;
    const token = localStorage.getItem("token");
    const url = id
      ? `http://localhost:3000/residents/${id}`
      : 'http://localhost:3000/residents';

    const formData = new FormData();

    const processedData = {
      ...input,
      dietary: input.dietary.join(','),
      diseases: input.diseases
        .filter(d => d.name.trim() !== '')
        .map(d => ({
          name: d.name.trim(),
          medicines: d.medicines
            .filter(m => m.name.trim() !== '')
            .map(m => ({
              name: m.name.trim(),
              dosage: m.dosage.trim(),
              frequency: m.frequency.trim()
            }))
        }))
    };

    const { document, photo, _id, ...dataToSend } = processedData;
    formData.append('data', JSON.stringify(dataToSend));

    if (input.document) {
      formData.append('document', input.document);
    } else if (input.existingDocument) {
      formData.append('existingDocument', input.existingDocument);
    }

    if (input.photo) {
      formData.append('photo', input.photo);
    } else if (input.existingPhoto) {
      formData.append('existingPhoto', input.existingPhoto);
    }

    const method = id ? axios.put : axios.post;
    method(url, formData, {
      headers: {
        Authorization: token,
        'Content-Type': 'multipart/form-data'
      }
    })
      .then((res) => {
        alert(res.data);
        navigate('/residents');
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to submit. Please check your input and try again.");
      });
  };

  return (
    <StyledPaper>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
        Resident Information Form
      </Typography>

      <SectionHeader>
        <Person fontSize="medium" />
        Basic Information
      </SectionHeader>

      <FormRow>
        <FormColumn>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={input.name}
            onChange={inputHandler}
            margin="normal"
            required
            variant="outlined"
            size="medium"
          />
        </FormColumn>
        <FormColumn>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
            <StyledAvatar
              src={previewPhoto || (input.existingPhoto && `http://localhost:3000/uploads/${input.existingPhoto}`)}
            />
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="resident-photo"
                type="file"
                onChange={handlePhotoChange}
              />
              <label htmlFor="resident-photo">
                <UploadButton
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                >
                  Upload Photo
                </UploadButton>
              </label>
              {input.photo && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {input.photo.name}
                </Typography>
              )}
            </Box>
          </Box>
        </FormColumn>
      </FormRow>

      <FormRow>
        <FormColumn>
          <TextField
            fullWidth
            label="Date of Birth"
            name="dob"
            type="date"
            value={input.dob}
            onChange={inputHandler}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            InputProps={{
              startAdornment: <Cake sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
        </FormColumn>
        <FormColumn>
          <Box sx={{ mt: 1 }}>
            <FormLabel component="legend" required sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <>{input.gender === 'female' ? <Female /> : <Male />}</>
              Gender
            </FormLabel>
            <RadioGroup
              row
              value={input.gender}
              onChange={(e) => setInput({ ...input, gender: e.target.value })}
            >
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="female" control={<Radio />} label="Female" />
              <FormControlLabel value="other" control={<Radio />} label="Other" />
            </RadioGroup>
          </Box>
        </FormColumn>
      </FormRow>

      <FormRow>
        <FormColumn>
          <TextField
            fullWidth
            label="Date of Admission"
            name="admissionDate"
            type="date"
            value={input.admissionDate}
            onChange={inputHandler}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            required
            variant="outlined"
            InputProps={{
              startAdornment: <Event sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
        </FormColumn>
        <FormColumn>
          <TextField
            fullWidth
            label="Emergency Contact Number"
            name="emergencyContact"
            value={input.emergencyContact}
            onChange={inputHandler}
            margin="normal"
            required
            variant="outlined"
            InputProps={{
              startAdornment: <Phone sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
        </FormColumn>
      </FormRow>

      <FormRow>
        <FormColumn>
          <TextField
            fullWidth
            label="Room Number"
            name="room"
            value={input.room}
            onChange={inputHandler}
            margin="normal"
            required
            variant="outlined"
            InputProps={{
              startAdornment: <Home sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
        </FormColumn>
        <FormColumn>
          <TextField
            fullWidth
            label="Medical History"
            name="history"
            value={input.history}
            onChange={inputHandler}
            multiline
            rows={3}
            margin="normal"
            variant="outlined"
            InputProps={{
              startAdornment: <LocalHospital sx={{ color: 'action.active', mr: 1, mt: -4 }} />
            }}
          />
        </FormColumn>
      </FormRow>

      <Divider sx={{ my: 4 }} />

      <SectionHeader>
        <Restaurant fontSize="medium" />
        Dietary Restrictions
      </SectionHeader>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            value={dietaryInput}
            onChange={(e) => setDietaryInput(e.target.value)}
            placeholder="Add dietary restriction"
            InputProps={{
              startAdornment: <Restaurant sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleDietaryAdd}
            disabled={!dietaryInput.trim()}
            startIcon={<Add />}
            sx={{ minWidth: 120 }}
          >
            Add
          </Button>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {input.dietary.map((item, index) => (
            <Chip
              key={index}
              label={item}
              onDelete={() => handleDietaryRemove(index)}
              color="primary"
              variant="outlined"
              deleteIcon={<Delete />}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      <SectionHeader>
        <LocalHospital fontSize="medium" />
        Medical Conditions & Medications
      </SectionHeader>

      {input.diseases.map((disease, diseaseIndex) => (
        <Card key={diseaseIndex} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                label={`Condition ${diseaseIndex + 1}`}
                value={disease.name}
                onChange={(e) => handleDiseaseChange(diseaseIndex, e.target.value)}
                sx={{ flexGrow: 1 }}
                fullWidth
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: <LocalHospital sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <IconButton
                onClick={() => removeDiseaseField(diseaseIndex)}
                color="error"
                sx={{ height: '56px', width: '56px' }}
              >
                <Delete />
              </IconButton>
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Medication color="secondary" />
              Medications for {disease.name || 'this condition'}:
            </Typography>

            {disease.medicines.map((med, medIndex) => (
              <Grid container spacing={2} key={medIndex} sx={{ mb: 2, ml: 1 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Medicine Name"
                    value={med.name}
                    onChange={(e) => handleMedicineChange(diseaseIndex, medIndex, 'name', e.target.value)}
                    fullWidth
                    size="medium"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Dosage"
                    value={med.dosage}
                    onChange={(e) => handleMedicineChange(diseaseIndex, medIndex, 'dosage', e.target.value)}
                    fullWidth
                    size="medium"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Frequency"
                    value={med.frequency}
                    onChange={(e) => handleMedicineChange(diseaseIndex, medIndex, 'frequency', e.target.value)}
                    fullWidth
                    size="medium"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    onClick={() => removeMedicineField(diseaseIndex, medIndex)}
                    color="error"
                    sx={{ height: '56px', width: '56px' }}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Button
              onClick={() => addMedicineField(diseaseIndex)}
              variant="outlined"
              size="medium"
              startIcon={<Add />}
              sx={{ ml: 1 }}
            >
              Add Medication
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button 
        onClick={addDiseaseField} 
        variant="outlined" 
        startIcon={<Add />}
        sx={{ mt: 1 }}
      >
        Add Medical Condition
      </Button>

      <Divider sx={{ my: 4 }} />

      <SectionHeader>
        <Warning fontSize="medium" />
        Allergies
      </SectionHeader>

      <TextField
        fullWidth
        label="Allergies (comma separated)"
        name="allergies"
        value={input.allergies}
        onChange={inputHandler}
        margin="normal"
        variant="outlined"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <Warning sx={{ color: 'action.active', mr: 1 }} />
        }}
      />

      <Divider sx={{ my: 4 }} />

      <SectionHeader>
        <Description fontSize="medium" />
        Medical Documents
      </SectionHeader>

      <Box sx={{ mb: 3 }}>
        <input
          type="file"
          id="document-upload"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
          onChange={(e) => setInput({ ...input, document: e.target.files[0] })}
          style={{ display: 'none' }}
        />
        <label htmlFor="document-upload">
          <UploadButton
            variant="contained"
            component="span"
            startIcon={<CloudUpload />}
            sx={{ mb: 2 }}
          >
            Upload Document
          </UploadButton>
        </label>
        
        {input.document && (
          <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />
            Selected: {input.document.name}
          </Typography>
        )}

        {!input.document && input.existingDocument && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Description color="primary" />
              Current document:
              <a
                href={`http://localhost:3000/uploads/${input.existingDocument}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 4 }}
              >
                {input.existingDocument}
              </a>
            </Typography>
            {/\.(jpg|jpeg|png|gif)$/i.test(input.existingDocument) && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={`http://localhost:3000/uploads/${input.existingDocument}`}
                  alt="Document preview"
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={submitHandler}
          size="large"
          sx={{ px: 6, py: 1.5, borderRadius: '8px', fontWeight: 600 }}
        >
          {input._id ? 'Update Resident' : 'Add Resident'}
        </Button>
      </Box>
    </StyledPaper>
  );
};

export default AddResident;
