'use client'
import { Box, Button, IconButton, Paper, styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Typography, TextField, Modal } from "@mui/material";
import { DeleteIcon, EditIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Data = {
    id: number | null;
    firstname: string;
    lastname: string;
    position: string;
    phone: string;
    email: string;
}

const defaultValues: Data = {
    id: null,
    firstname: '',
    lastname: '',
    position: '',
    phone: '',
    email: '',
}

const HomePage = () => {
    const [columns, setColumns] = useState<string[]>([
        'First Name',
        'Last Name',
        'Position',
        'Phone Number',
        'Email Address',
    ]);
    const [rows, setRows] = useState<Data[]>([]);
    const [formData, setFormData] = useState<Data>(defaultValues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const hasErrors = Object.keys(errors).length > 0;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/home', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                setRows(data.rows);        
            } else {
                console.error("Failed to fetch data", response.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
          backgroundColor: theme.palette.common.black,
          color: theme.palette.common.white,
        },
        [`&.${tableCellClasses.body}`]: {
          fontSize: 14,
        },
      }));
      
    const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
          backgroundColor: theme.palette.action.hover,
        },
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }));

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            
            localStorage.removeItem('token');
            if(response.ok){
                window.location.href = '/login'
            }
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setFormData(defaultValues); 
        setErrors({});
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Data) => {
        setFormData({
            ...formData,
            [field]: e.target.value,
        });
    };
    const handleEdit = (row: Data) => {
        setFormData(row);  
        setIsModalOpen(true);
    };

    const validateForm = async (): Promise<boolean> => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstname) newErrors.firstname = "First name is required";
        if (!formData.lastname) newErrors.lastname = "Last name is required";
        if (!formData.position) newErrors.position = "Position is required";
        if (!formData.phone) newErrors.phone = "Phone number is required";
        if (!formData.email) newErrors.email = "Email is required";

        if (!/^\d{1,10}$/.test(formData.phone)) {
            newErrors.phone = "Phone number must be numeric and up to 10 digits";
        }

        if (!newErrors.email && !/\.(com|id)$/.test(formData.email)) {
            newErrors.email = "Email must end with .com or .id";
        }

        if (!newErrors.email) {
            try {
                const response = await fetch('http://localhost:8080/api/check-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ email: formData.email, currentEmail: formData.id ? rows.find(row => row.id === formData.id)?.email : '' }),
                });
    
                if (response.ok) {
                    const data = await response.json();
                    if (!data.isUnique) {
                        newErrors.email = "Email must be unique";
                    }
                } else {
                    console.error("Failed to check email uniqueness", response.statusText);
                }
            } catch (error) {
                console.error('Error checking email uniqueness:', error);
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; 
    };

    const handleSave = async () => {
        const isValid = await validateForm();
        if (!isValid) return; 

        try {
            const url = formData.id === null ? 'http://localhost:8080/api/add' : `http://localhost:8080/api/edit/${formData.id}`;
            const method  = formData.id === null ? 'POST' : 'PUT';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const savedRow = await response.json();
                if (method === 'POST') {
                    setRows([...rows, savedRow]);
                } else {
                    setRows(rows.map(row => row.id === formData.id ? savedRow : row));
                }
                handleCloseModal();
                fetchData();
            } else {
                console.error("Failed to save data", response.statusText);
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleDelete = async (row: Data) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
            setFormData(row);
        try {
            const response = await fetch(`http://localhost:8080/api/delete/${row.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchData();
            } else {
                console.error("Failed to delete data", response.statusText);
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };
    return (
        <Box
            sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: '100vw',
            height: '100vh',
            borderRadius: 2,
            bgcolor: 'lightblue',
            position: 'relative', 
            }}
        >
            
            <div>
                <div className="d-flex flex-col-reverse justify-center">
                    <Typography variant="h3" component="h2" sx={{ margin: 2 }}>Home Page</Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleOpenModal}
                    >
                        <PlusIcon />
                    </Button>
                </div>
                
                <TableContainer component={Paper} sx={{ position: 'relative' }}>
                    <Table sx={{ minWidth: 1000 }} aria-label="customized table">
                        <TableHead>
                            <TableRow>
                                {columns.map((column, index) => (
                                    <StyledTableCell key={index}>{column}</StyledTableCell>
                                ))}
                                <StyledTableCell>Actions</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length > 0 ? (
                                <>
                                    {rows.map((row, rowIndex) => (
                                        <StyledTableRow key={rowIndex}>
                                            <StyledTableCell>{row.firstname}</StyledTableCell>
                                            <StyledTableCell>{row.lastname}</StyledTableCell>
                                            <StyledTableCell>{row.position}</StyledTableCell>
                                            <StyledTableCell>{row.phone}</StyledTableCell>
                                            <StyledTableCell>{row.email}</StyledTableCell>
                                            <StyledTableCell>
                                                <div className="flex justify-end p-2">
                                                    <IconButton color="primary" onClick={() => handleEdit(row)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="primary" onClick={() => handleDelete(row)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </div>
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    ))}
                                </>
                            ) : (
                                <StyledTableRow>
                                    <StyledTableCell colSpan={columns.length + 1} align="center">
                                        No data
                                    </StyledTableCell>
                                </StyledTableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            
            <Button onClick={handleLogout} variant="contained" color="primary" sx={{ marginTop: 2 }}>
                Logout
            </Button>

            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                aria-labelledby="add-new-data-modal"
                aria-describedby="form-to-add-new-data"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 500,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="add-new-data-modal" variant="h6" component="h2">
                        Add New Data
                    </Typography>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="First Name"
                            value={formData.firstname}
                            onChange={(e) => handleInputChange(e, 'firstname')}
                        />
                        {errors.firstname && (
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: '#d32f2f', 
                                    color: '#fff', 
                                    position: 'absolute',
                                    bottom: -30,
                                    left: 0,
                                    width: '100%',
                                }}
                            >
                                {errors.firstname}
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Last Name"
                            value={formData.lastname}
                            onChange={(e) => handleInputChange(e, 'lastname')}
                            sx={{ marginTop: hasErrors ? '40px' : '16px' }}
                        />
                        {errors.lastname && (
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: '#d32f2f', 
                                    color: '#fff', 
                                    position: 'absolute',
                                    bottom: -30,
                                    left: 0,
                                    width: '100%',
                                }}
                            >
                                {errors.lastname}
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Position"
                            value={formData.position}
                            onChange={(e) => handleInputChange(e, 'position')}
                            sx={{ marginTop: hasErrors ? '40px' : '16px' }}
                        />
                        {errors.position && (
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: '#d32f2f', 
                                    color: '#fff', 
                                    position: 'absolute',
                                    bottom: -30,
                                    left: 0,
                                    width: '100%',
                                }}
                            >
                                {errors.position}
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => handleInputChange(e, 'phone')}
                            sx={{ marginTop: hasErrors ? '40px' : '16px' }}
                        />
                        {errors.phone && (
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: '#d32f2f', 
                                    color: '#fff', 
                                    position: 'absolute',
                                    bottom: -30,
                                    left: 0,
                                    width: '100%',
                                }}
                            >
                                {errors.phone}
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Email"
                            value={formData.email}
                            onChange={(e) => handleInputChange(e, 'email')}
                            sx={{ marginTop: hasErrors ? '40px' : '16px' }}
                        />
                        {errors.email && (
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: '#d32f2f', 
                                    color: '#fff', 
                                    position: 'absolute',
                                    bottom: -30,
                                    left: 0,
                                    width: '100%',
                                }}
                            >
                                {errors.email}
                            </Button>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        sx={{ mt: 5 }}
                    >
                        Save
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default HomePage;
