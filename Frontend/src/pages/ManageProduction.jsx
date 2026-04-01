import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

import apiRequest from "../utils/ApiRequest";

function ProductionForm({ onSuccess, onCancel, activeFirm, editData = null, machines, employees, designs }) {
  const theme = useTheme();
  
  const [form, setForm] = useState(
    editData ? { 
      machine_id: editData.machine_id?._id || "", 
      employee_id: editData.employee_id?._id || "", 
      design_id: editData.design_id?._id || "", 
      date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : "", 
      shift: editData.shift || "Day", 
      produced_quantity: editData.produced_quantity || "" 
    } : { machine_id: "", employee_id: "", design_id: "", date: new Date().toISOString().split('T')[0], shift: "Day", produced_quantity: "" }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(""); };
  
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { 
      const payload = { ...form, produced_quantity: Number(form.produced_quantity), company_id: activeFirm?._id }; 
      const res = editData ? await apiRequest.put(`/production/${editData._id}`, payload) : await apiRequest.post("/production", payload); 
      onSuccess(res.data.data); 
    }
    catch (err) { setError(err?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}
      <Typography variant="body2" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px" }}>Production Details</Typography>
      
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Date" name="date" type="date" value={form.date} onChange={handleChange} required size="small" InputLabelProps={{ shrink: true }} />
        
        <FormControl size="small" required>
          <InputLabel>Shift</InputLabel>
          <Select name="shift" value={form.shift} onChange={handleChange} label="Shift">
            <MenuItem value="Day">Day Shift</MenuItem>
            <MenuItem value="Night">Night Shift</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" required>
          <InputLabel>Machine</InputLabel>
          <Select name="machine_id" value={form.machine_id} onChange={handleChange} label="Machine">
            {machines.map((m) => <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" required>
          <InputLabel>Employee</InputLabel>
          <Select name="employee_id" value={form.employee_id} onChange={handleChange} label="Employee">
            {employees.map((e) => <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" required>
          <InputLabel>Design</InputLabel>
          <Select name="design_id" value={form.design_id} onChange={handleChange} label="Design">
            {designs.map((d) => <MenuItem key={d._id} value={d._id}>{d.design_no}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField label="Produced Qty" name="produced_quantity" type="number" value={form.produced_quantity} onChange={handleChange} required size="small" inputProps={{ min: 1 }} />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>{loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editData ? "Save Changes" : "Log Production"}</Button>
      </Box>
    </Box>
  );
}

export default function ManageProduction() {
  const [productions, setProductions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designs, setDesigns] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduction, setEditProduction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { activeFirm } = useAuth();
  const theme = useTheme();

  const fetchData = async () => { 
    if (!activeFirm?._id) return; 
    setLoading(true); 
    try { 
      const [prodRes, machRes, empRes, desRes] = await Promise.all([
        apiRequest.get("/production", { params: { company_id: activeFirm._id } }),
        apiRequest.get("/machine", { params: { company_id: activeFirm._id } }),
        apiRequest.get("/employee", { params: { company_id: activeFirm._id } }),
        apiRequest.get("/design", { params: { company_id: activeFirm._id } }),
      ]);
      setProductions(prodRes.data.data || []); 
      setMachines(machRes.data.data?.filter(m => m.is_active) || []);
      setEmployees(empRes.data.data?.filter(e => e.is_active) || []);
      setDesigns(desRes.data.data || []);
    } catch { 
      setProductions([]); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  useEffect(() => { fetchData(); }, [activeFirm]);

  const handleCreateSuccess = (p) => { setCreateOpen(false); fetchData(); };
  const handleEditSuccess = (p) => { setEditProduction(null); fetchData(); };
  const handleDelete = async () => { if (!deleteTarget) return; setDeleteLoading(true); try { await apiRequest.delete(`/production/${deleteTarget._id}`, { params: { company_id: activeFirm._id } }); setProductions((p) => p.filter((x) => x._id !== deleteTarget._id)); setDeleteTarget(null); } catch {} finally { setDeleteLoading(false); } };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "20px", md: "26px" } }}>Production Log</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Track daily machine and employee outputs</Typography>
        </Box>
        <Button variant="contained" startIcon={<AssignmentTurnedInOutlinedIcon />} onClick={() => setCreateOpen(true)}>Log Production</Button>
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: "16px" }} />
      ) : productions.length === 0 ? (
        <Paper elevation={0} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: "16px", p: 8, textAlign: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}><FactoryOutlinedIcon sx={{ color: "#4F46E5", fontSize: 30 }} /></Box>
          <Typography variant="h6" color="text.primary" mb={0.5}>No production records</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Add your first production log to track manufacturing progress</Typography>
          <Button variant="contained" startIcon={<AssignmentTurnedInOutlinedIcon />} onClick={() => setCreateOpen(true)}>Log Production</Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "16px", overflow: "hidden" }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Machine</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Design</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productions.map((row) => (
                <TableRow key={row._id} sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { backgroundColor: theme.palette.action.hover } }}>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>{row.shift}</TableCell>
                  <TableCell>{row.machine_id?.name || "N/A"}</TableCell>
                  <TableCell>{row.employee_id?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                      {row.design_id?.design_no || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{row.produced_quantity}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditProduction(row)}>
                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ "&:hover": { color: "error.main" } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Add Production Log</Typography><IconButton size="small" onClick={() => setCreateOpen(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}><ProductionForm onSuccess={handleCreateSuccess} onCancel={() => setCreateOpen(false)} activeFirm={activeFirm} machines={machines} employees={employees} designs={designs} /></DialogContent>
      </Dialog>

      <Dialog open={Boolean(editProduction)} onClose={() => setEditProduction(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle1">Edit Production Log</Typography><IconButton size="small" onClick={() => setEditProduction(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton></Box>
        <DialogContent sx={{ p: 0 }}>{editProduction && <ProductionForm onSuccess={handleEditSuccess} onCancel={() => setEditProduction(null)} activeFirm={activeFirm} editData={editProduction} machines={machines} employees={employees} designs={designs} />}</DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.5 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "14px", backgroundColor: "error.light", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}><WarningAmberIcon sx={{ color: "#fff", fontSize: 28 }} /></Box>
          <Typography variant="h6">Delete Production Record?</Typography>
          <Typography variant="body2" color="text.secondary">Are you sure you want to delete this log? This cannot be undone.</Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={handleDelete} disabled={deleteLoading} color="error">{deleteLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
