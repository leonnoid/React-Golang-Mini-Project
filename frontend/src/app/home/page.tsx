'use client'
import { Box, Button, IconButton, Paper, styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Typography, TextField, Modal, TablePagination } from "@mui/material";
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
    const token = localStorage.getItem('token');
    const [rows, setRows] = useState<Data[]>([]);
    const [formData, setFormData] = useState<Data>(defaultValues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const hasErrors = Object.keys(errors).length > 0;
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!token) {
            window.location.href = '/login';
            return;
        }
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
            } else if(response.status === 401){
                window.location.href = '/login'; 
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
            textAlign: 'center'
        },
        [`&.${tableCellClasses.body}`]: {
            fontSize: 14,
            textAlign: 'center'
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

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                height: '100vh',
                position: 'relative',
            }}
        >
            <Button
                variant="contained"
                color="primary"
                onClick={handleLogout}
                sx={{ position: 'absolute', top: 16, right: 16 }}
            >
                Logout
            </Button>
            <Typography variant="h3" component="h2" sx={{ marginBottom: 2, textAlign: 'center' }}>
                Employee Data
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenModal}
                    sx = {{marginRight: '12.5%' }}
                >
                    <PlusIcon />
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ width: '75%', mt: 2, borderRadius: 4}}>
                <Table sx={{ minWidth: 1000}} aria-label="customized table">
                    <TableHead>
                        <TableRow>
                            {columns.map((column, index) => (
                                <StyledTableCell key={index}>{column}</StyledTableCell>
                            ))}
                            <StyledTableCell>Actions</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <StyledTableRow key={row.id}>
                                <StyledTableCell>{row.firstname}</StyledTableCell>
                                <StyledTableCell>{row.lastname}</StyledTableCell>
                                <StyledTableCell>{row.position}</StyledTableCell>
                                <StyledTableCell>{row.phone}</StyledTableCell>
                                <StyledTableCell>{row.email}</StyledTableCell>
                                <StyledTableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleEdit(row)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(row)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </StyledTableCell>
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            </TableContainer>
            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 4,
                    }}
                >
                    <Typography variant="h6" component="h2" sx={{ marginBottom: 2 }}>
                        {formData.id === null ? 'Add New Record' : 'Edit Record'}
                    </Typography>
                    <TextField
                        fullWidth
                        label="First Name"
                        variant="outlined"
                        value={formData.firstname}
                        onChange={(e) => handleInputChange(e, 'firstname')}
                        error={!!errors.firstname}
                        helperText={errors.firstname}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        variant="outlined"
                        value={formData.lastname}
                        onChange={(e) => handleInputChange(e, 'lastname')}
                        error={!!errors.lastname}
                        helperText={errors.lastname}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Position"
                        variant="outlined"
                        value={formData.position}
                        onChange={(e) => handleInputChange(e, 'position')}
                        error={!!errors.position}
                        helperText={errors.position}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Phone Number"
                        variant="outlined"
                        value={formData.phone}
                        onChange={(e) => handleInputChange(e, 'phone')}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        value={formData.email}
                        onChange={(e) => handleInputChange(e, 'email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        sx={{ marginBottom: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            startIcon={<SaveIcon />}
                            sx={{ marginRight: 2 }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
}

export default HomePage;
