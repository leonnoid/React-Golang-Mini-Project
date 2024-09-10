'use client'
import apiService from "@/components/ui/apiService/apiService";
import { Box, Button, IconButton, Paper, styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Typography, TextField, Modal, TablePagination, Menu, MenuItem, TableSortLabel } from "@mui/material";
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
    const columns = [
        { id: 'firstname', label: 'First Name' },
        { id: 'lastname', label: 'Last Name' },
        { id: 'position', label: 'Position' },
        { id: 'phone', label: 'Phone' },
        { id: 'email', label: 'Email' }
    ];
    const [currentUsername, setCurrentUsername] = useState("");
    const [token, setToken] = useState<string | null>();
    const [userId, setUserId] =useState<string | null>();
    const [rows, setRows] = useState<Data[]>([]);
    const [formData, setFormData] = useState<Data>(defaultValues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const hasErrors = Object.keys(errors).length > 0;
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const rowCount = rows ? rows.length : 0;
    const pageCount = Math.ceil(rowCount / rowsPerPage);
    const adjustedPage = page >= pageCount ? 0 : page;
    const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
    const open = Boolean(anchorEl);
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('firstname');
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [profileFormData, setProfileFormData] = useState<{ username: string, password: string, newpassword: string }>({ username: '', password: '' , newpassword: '' });
    
    const handleMenuClose = () => setAnchorEl(null);
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const formatPhoneNumber = (input: string) => {
        if (input === undefined || input === null || input.length === 0) {
            return '';
        }

        const part1 = input.slice(0, 3);
        const part2 = input.slice(3, 6); 
        const part3 = input.slice(6);

        return `(${part1}) ${part2}-${part3}`;
    };

    const handleRequestSort = (property: string) => {
        const isAscending = orderBy === property && order === 'asc';
        setOrder(isAscending ? 'desc' : 'asc');
        setOrderBy(property);
      };
      
    const getSortedRows = () => {
        return rows.slice().sort((a, b) => {
            const valueA = a[orderBy as keyof Data] ?? ''; 
            const valueB = b[orderBy as keyof Data] ?? '';
        
            if (valueA < valueB) {
            return order === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
            return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };
    useEffect(() => {
        const token = localStorage.getItem('token');
        const loggedInUserID = localStorage.getItem('userId');
        setUserId(loggedInUserID);
        if(token !== null && token !== undefined){
            fetchData();
        } else{
            window.location.href = '/login'
        }
    }, []);

    const fetchData = async () => {
        const response = await apiService.get('/api/get');
        setRows(response.rows);
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
        handleClose();
        await apiService.post('/api/logout', null);
        
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login'
            
        
    };

    const handleOpenModal = () => {
        setFormData(defaultValues); 
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setFormData(defaultValues); 
        setErrors({});
        setIsModalOpen(false);
    };

    const handleCloseProfileModal = () => {
        setErrors({})
        setError("");
        setIsEditProfileModalOpen(false)
    }

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

        if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Phone number must be numeric and excatly 10 digits";
        }

        if (!newErrors.email && !/\.(com|id)$/.test(formData.email)) {
            newErrors.email = "Email must end with .com or .id";
        }

        if (!newErrors.email) {
            const response = await apiService.post('/api/check-email', { email: formData.email, currentEmail: formData.id ? rows.find(row => row.id === formData.id)?.email : '' })

            if (response.ok) {
                if (!response.isUnique) {
                    newErrors.email = "Email must be unique";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; 
    };

    const handleSave = async () => {
        const isValid = await validateForm();
        if (!isValid) return; 


            let response;
            let method;
            if(formData.id === null){
                response = await apiService.post('/api/add', formData)
                method = 'POST';
            } else{
                response = await apiService.put('/api/edit/' + formData.id, formData)
                method = 'PUT';
            }
            if (method === 'POST') {
                if (rows === null) {
                    setRows([response]);
                } else {
                    setRows([...rows, response]);
                }
            } else {
                setRows(rows.map(row => row.id === formData.id ? response : row));
            }
            handleCloseModal();
            fetchData();
    };

    const handleDelete = async (row: Data) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
            setFormData(row);
        await apiService.delete(`/api/delete/` + row.id)
        fetchData();
    };

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEditProfile = async () => {
        setIsEditProfileModalOpen(true);
        
        const response = await apiService.get('/api/get-profile/' + userId)

        setProfileFormData({
            username: response.Username,
            password: '', 
            newpassword: '',
        });
        handleMenuClose();
        
    };

    const validateUsername = async (username: string) => {
        const response = await apiService.post('/api/check-username', {username});
    
        if (!response.isUnique) {
            setErrors({ Username: 'Username already taken' });
            return false;
        }
        setErrors({});
        return true;
        
      };

    const handleSaveProfile = async () => {
        setError("");
        setErrors({})
        let hasErrors = false;
        setCurrentUsername(profileFormData.username) 
        if (!profileFormData.username) {
            setErrors(prevErrors => ({ ...prevErrors, username: 'Username is required' }));
            hasErrors = true;
        } else{
            if(profileFormData.username != currentUsername){
                const isUsernameUnique = await validateUsername(profileFormData.username);
                if(!isUsernameUnique) {
                    setErrors( prevErrors => ({ ...prevErrors, username: 'Username already taken' }));
                    hasErrors = true;
                }
            }
        }
        if(!profileFormData.password) {
            setErrors(prevErrors => ({ ...prevErrors, password: "Please enter your password to save changes." }));
            hasErrors = true;
        }
        if (profileFormData.newpassword && !profileFormData.password) {
            setErrors(prevErrors => ({ ...prevErrors, password: 'Please enter your current password to set a new password.' }));
            hasErrors = true;
        }
        if (profileFormData.newpassword != '' && profileFormData.newpassword.length < 8) {
            setErrors(prevErrors => ({ ...prevErrors, newpassword: 'Password must be at least 8 characters long' }));
            hasErrors = true;
        }

        if(hasErrors) return
        const response = await apiService.put('/api/edit-profile', profileFormData);

        localStorage.setItem('token', response.token);
        setIsEditProfileModalOpen(false);
        setError("");
        setErrors({});
        alert('Data Updated')
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
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ position: 'absolute', top: 16, right: 16 }}
            >
                Dashboard
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleEditProfile}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
            <Modal
                open={isEditProfileModalOpen}
                onClose={handleCloseProfileModal}
                aria-labelledby="edit-profile-modal-title"
                aria-describedby="edit-profile-modal-description"
            >
                <Box 
                    sx={{ 
                        width: 400, 
                        margin: 'auto', 
                        marginTop: '20%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-evenly', 
                        padding: 2, 
                        backgroundColor: 'background.paper', 
                        borderRadius: 4,
                        border: '2px solid #000',
                        boxShadow: 24}}
                >
                <Typography variant="h6" id="edit-profile-modal-title">
                    Edit Profile
                </Typography>
                <Box sx={{ position: 'relative', width: '100%' , display: 'flex', flexDirection:"column" , alignItems:"center"}}>
                <TextField
                    fullWidth
                    label="Username"
                    variant="outlined"
                    value={profileFormData.username}
                    onChange={(e) => setProfileFormData({ ...profileFormData, username: e.target.value })}
                    error={!!errors.username}
                    helperText={errors.username}
                    sx={{ marginBottom: 2 }}
                />
                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    variant="outlined"
                    value={profileFormData.password}
                    onChange={(e) => setProfileFormData({ ...profileFormData, password: e.target.value })}
                    error={!!errors.password}
                    helperText={errors.password}
                    sx={{ marginBottom: 2 }}
                />
                <TextField
                    fullWidth
                    label="NewPassword"
                    type="password"
                    variant="outlined"
                    value={profileFormData.newpassword}
                    onChange={(e) => setProfileFormData({ ...profileFormData, newpassword: e.target.value })}
                    error={!!errors.newpassword}
                    helperText={errors.newpassword}
                    sx={{ marginBottom: 2 }}
                />
                {error && (  
                    <Typography color="error" sx={{
                        fontSize: '14px',  
                        fontWeight: 400,
                    }}>
                        {error}
                    </Typography>
                    )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveProfile}
                            startIcon={<SaveIcon />}
                            sx={{ marginRight: 2 }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleCloseProfileModal}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>
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
            <TableContainer component={Paper} 
                sx={{ 
                    width: '75%', 
                    mt: 2, 
                    mb: 4, 
                    borderRadius: 4, 
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto',
                    '::-webkit-scrollbar': { display: 'none' }
                    }}>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Table sx={{ minWidth: 1000}} aria-label="customized table">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <StyledTableCell
                                    key={column.id}
                                    sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, cursor: 'pointer' }}
                                    onClick={() => handleRequestSort(column.id)}
                                >
                                    {column.label}
                                    {orderBy === column.id ? (
                                        <span>{order === 'asc' ? '▲' : '▼'}</span>
                                    ) : null}
                                </StyledTableCell>
                            ))}
                            <StyledTableCell sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>Actions</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {(rows && rows.length > 0 ? 
                        (rowsPerPage > 0
                            ? getSortedRows().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            : getSortedRows()
                        ).map((row) => (
                            <StyledTableRow key={row.id}>
                                <StyledTableCell>{row.firstname}</StyledTableCell>
                                <StyledTableCell>{row.lastname}</StyledTableCell>
                                <StyledTableCell>{row.position}</StyledTableCell>
                                <StyledTableCell>{formatPhoneNumber(row.phone)}</StyledTableCell>
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
                        ))
                        : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} align="center">
                                    No Data Available
                                </TableCell>
                            </TableRow>
                        )
                    )}
                    </TableBody>
                </Table>
                </Box>
                <Box sx={{ p: 2 }}>
                    <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={rowCount}
                    rowsPerPage={rowsPerPage}
                    page={adjustedPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Box>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ marginBottom: 2 }}>
                            {formData.id === null ? 'Add New Record' : 'Edit Record'}
                        </Typography>
                    </Box>
                    
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
