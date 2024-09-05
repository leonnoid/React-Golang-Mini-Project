'use client'
import { Box, Button, IconButton, Paper, styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Typography, TextField, Modal } from "@mui/material";
import { DeleteIcon, EditIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Data = {
    firstname: string;
    lastname: string;
    position: string;
    phone: string;
    email: string;
}

const defaultValues: Data = {
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

    useEffect(() => {
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
                    
                    const updatedRows = data.rows.map((row: any) => ({
                        firstname: row.firstname || defaultValues.firstname,
                        lastname: row.lastname || defaultValues.lastname,
                        position: row.position || defaultValues.position,
                        phone: row.phone || defaultValues.phone,
                        email: row.email || defaultValues.email,
                    }))
                    setRows(updatedRows);        
                } else {
                    console.error("Failed to fetch data", response.statusText);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);
    
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
        setFormData(defaultValues);  // Reset form data
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Data) => {
        setFormData({
            ...formData,
            [field]: e.target.value,
        });
    };

    const handleSave = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const savedRow = await response.json();
                setRows([...rows, savedRow]);
                handleCloseModal();
            } else {
                console.error("Failed to save data", response.statusText);
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
                                                    <IconButton color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="primary">
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
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="add-new-data-modal" variant="h6" component="h2">
                        Add New Data
                    </Typography>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="First Name"
                        value={formData.firstname}
                        onChange={(e) => handleInputChange(e, 'firstname')}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Last Name"
                        value={formData.lastname}
                        onChange={(e) => handleInputChange(e, 'lastname')}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Position"
                        value={formData.position}
                        onChange={(e) => handleInputChange(e, 'position')}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange(e, 'phone')}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange(e, 'email')}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        sx={{ mt: 2 }}
                    >
                        Save
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default HomePage;
