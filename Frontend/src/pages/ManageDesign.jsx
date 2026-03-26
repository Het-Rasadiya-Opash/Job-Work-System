/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-empty */
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import apiRequest from "../utils/ApiRequest";

/* ─── Design Form ────────────────────────────────────────────────── */
const initialForm = { design_number: "", vepari_id: "", description: "", stitch_count: "", rate_per_1000: "", image_url: "", parts: [] };

function DesignForm({ onSuccess, onCancel, activeFirm, editData = null, veparis, customParts = [], onPartAdded }) {
  const theme = useTheme();
  
  const availableParts = [...new Set(customParts || [])];
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [partLoading, setPartLoading] = useState(false);

  const [form, setForm] = useState(
    editData
      ? { design_number: editData.design_number || "", vepari_id: editData.vepari_id?._id || editData.vepari_id || "", description: editData.description || "", stitch_count: editData.stitch_count || "", rate_per_1000: editData.rate_per_1000 || "", image_url: editData.image_url || "", is_active: editData.is_active ?? true, parts: editData.parts || [] }
      : initialForm
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddCustomPart = async () => {
    if (!newPartName.trim()) return;
    setPartLoading(true);
    try {
      const res = await apiRequest.post("/design/part", { company_id: activeFirm._id, part_name: newPartName.trim() });
      const addedPart = res.data.data.part_name;
      if (onPartAdded) onPartAdded(addedPart);
      
      const existing = form.parts.find(p => p.part_name === addedPart);
      if (!existing) {
        setForm(prev => ({
          ...prev,
          parts: [...prev.parts, { part_name: addedPart, stitch_count: "", head_count: 1, stitch_rate: "" }]
        }));
      }

      setPartModalOpen(false);
      setNewPartName("");
    } catch(err) {
      setError(err?.response?.data?.message || "Failed to add custom part");
    } finally {
      setPartLoading(false);
    }
  };

  const handlePartSelect = (event) => {
    const { target: { value } } = event;
    const selected = typeof value === 'string' ? value.split(',') : value;
    const newParts = [];
    selected.forEach(partName => {
      const existing = form.parts.find(p => p.part_name === partName);
      if (existing) newParts.push(existing);
      else newParts.push({ part_name: partName, stitch_count: "", head_count: 1, stitch_rate: "" });
    });
    setForm(prev => ({ ...prev, parts: newParts }));
  };

  const handlePartChange = (index, field, value) => {
    const updatedParts = [...form.parts];
    updatedParts[index][field] = value;
    setForm(prev => ({ ...prev, parts: updatedParts }));
  };

  const selectedPartNames = form.parts.map(p => p.part_name);
  
  const totalPartsRate = form.parts.reduce((sum, part) => {
    const sc = Number(part.stitch_count) || 0;
    const hc = Number(part.head_count) || 0;
    const sr = Number(part.stitch_rate) || 0;
    return sum + (sc / 1000) * hc * sr;
  }, 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "design_number" ? value.toUpperCase() : value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if ((!form.stitch_count || !form.rate_per_1000) && form.parts.length === 0) {
        throw new Error("Please either enter Base Stitch Count and Rate, or select at least one Design Part.");
      }
      
      const partsPayload = form.parts.map(p => ({
        ...p,
        stitch_count: Number(p.stitch_count),
        head_count: Number(p.head_count),
        stitch_rate: Number(p.stitch_rate)
      }));

      const payload = { 
        ...form, 
        stitch_count: form.stitch_count ? Number(form.stitch_count) : undefined, 
        rate_per_1000: form.rate_per_1000 ? Number(form.rate_per_1000) : undefined,
        parts: partsPayload,
        company_id: activeFirm?._id 
      };
      const res = editData ? await apiRequest.put(`/design/${editData._id}`, payload) : await apiRequest.post("/design", payload);
      onSuccess(res.data.data);
    } catch (err) { setError(err?.response?.data?.message || err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Design Number" name="design_number" value={form.design_number} onChange={handleChange} required size="small" inputProps={{ style: { textTransform: "uppercase" } }} />
        <TextField select label="Party (Vepari)" name="vepari_id" value={form.vepari_id} onChange={handleChange} required size="small">
          {veparis.map((v) => <MenuItem key={v._id} value={v._id}>{v.name} {v.company_name ? `(${v.company_name})` : ""}</MenuItem>)}
        </TextField>
        <Box sx={{ gridColumn: form.parts.length === 0 ? "1 / 3" : "auto", display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Design Parts</InputLabel>
              <Select
                multiple
                value={selectedPartNames}
                onChange={handlePartSelect}
                input={<OutlinedInput label="Design Parts" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                  </Box>
                )}
                sx={{ borderRadius: "8px" }}
              >
                {availableParts.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={selectedPartNames.indexOf(name) > -1} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" sx={{ flexShrink: 0, height: 40, borderColor: theme.palette.divider, color: theme.palette.text.primary }} onClick={() => setPartModalOpen(true)}>
              + Add Custom Part
            </Button>
          </Box>
        </Box>
        {form.parts.length === 0 && (
          <>
            <TextField label="Base Stitch Count" name="stitch_count" value={form.stitch_count} onChange={handleChange} type="number" inputProps={{ min: 0 }} size="small" />
            <TextField label="Base Rate per 1000" name="rate_per_1000" value={form.rate_per_1000} onChange={handleChange} type="number" inputProps={{ step: "0.01", min: 0 }} size="small" />
          </>
        )}
      </Box>

      {form.parts.length > 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell>Part Name</TableCell>
                <TableCell width="20%">Stitch Count</TableCell>
                <TableCell width="15%">Head</TableCell>
                <TableCell width="15%">Stitch Rate</TableCell>
                <TableCell align="right" width="20%">Part Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.parts.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 600 }}>{p.part_name}</TableCell>
                  <TableCell>
                    <TextField size="small" type="number" required value={p.stitch_count} onChange={(e) => handlePartChange(idx, "stitch_count", e.target.value)} inputProps={{ min: 0 }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" required value={p.head_count} onChange={(e) => handlePartChange(idx, "head_count", e.target.value)} inputProps={{ min: 1 }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" required value={p.stitch_rate} onChange={(e) => handlePartChange(idx, "stitch_rate", e.target.value)} inputProps={{ step: "0.01", min: 0 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="primary">
                      ₹{(((Number(p.stitch_count) || 0) / 1000) * (Number(p.head_count) || 0) * (Number(p.stitch_rate) || 0)).toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>Total Design Rate:</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "success.main" }}>₹{totalPartsRate.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TextField label="Description" name="description" value={form.description} onChange={handleChange} size="small" fullWidth />
      <TextField label="Image URL" name="image_url" value={form.image_url} onChange={handleChange} size="small" fullWidth placeholder="https://..." />

      {editData && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">Status</Typography>
            <Typography variant="body2" fontSize="12px" color={form.is_active ? "success.main" : "error.main"}>{form.is_active ? "Active" : "Inactive"}</Typography>
          </Box>
          <Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} color="success" />
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cancel</Button>
        <Button variant="contained" fullWidth type="submit" disabled={loading}>
          {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editData ? "Save Changes" : "Create Design"}
        </Button>
      </Box>

      {/* Add Custom Part Dialog Inside Form */}
      <Dialog open={partModalOpen} onClose={() => setPartModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
         <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
           <Typography variant="subtitle1" fontWeight={600}>Add Custom Part Type</Typography>
         </Box>
         <DialogContent sx={{ p: 3 }}>
           <TextField fullWidth size="small" label="Part Name" placeholder="e.g. Collar" value={newPartName} onChange={e => setNewPartName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCustomPart()} autoFocus />
         </DialogContent>
         <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
           <Button onClick={() => setPartModalOpen(false)} sx={{ color: theme.palette.text.secondary }}>Cancel</Button>
           <Button variant="contained" onClick={handleAddCustomPart} disabled={!newPartName.trim() || partLoading}>
             {partLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Add Part"}
           </Button>
         </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ManageDesign() {
  const [designs, setDesigns] = useState([]);
  const [veparis, setVeparis] = useState([]);
  const [customParts, setCustomParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDesign, setEditDesign] = useState(null);
  const [viewDesign, setViewDesign] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeFirm } = useAuth();
  const theme = useTheme();

  useEffect(() => { if (location.state?.openCreate) { setCreateOpen(true); navigate(location.pathname, { replace: true, state: {} }); } }, [location.state]);

  const fetchData = async () => {
    if (!activeFirm?._id) return;
    setLoading(true);
    const p = { params: { company_id: activeFirm._id } };
    const fetchSafe = async (url) => { try { const res = await apiRequest.get(url, p); return res.data?.data || null; } catch { return null; } };
    const [dData, vData, pData] = await Promise.all([fetchSafe("/design"), fetchSafe("/vepari"), fetchSafe("/design/part")]);
    setDesigns(dData || []);
    setVeparis(vData || []);
    setCustomParts(pData ? pData.map(part => part.part_name) : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeFirm]);

  const handleCreateSuccess = (newDesign) => { setCreateOpen(false); const pop = veparis.find(v => v._id === newDesign.vepari_id) || newDesign.vepari_id; setDesigns((p) => [{ ...newDesign, vepari_id: pop }, ...p]); };
  const handleEditSuccess = (updated) => { setEditDesign(null); const pop = veparis.find(v => v._id === (updated.vepari_id?._id || updated.vepari_id)) || updated.vepari_id; setDesigns((p) => p.map((d) => d._id === updated._id ? { ...updated, vepari_id: pop } : d)); };
  const handleDelete = async () => { if (!deleteTarget) return; setDeleteLoading(true); try { await apiRequest.delete(`/design/${deleteTarget._id}`, { params: { company_id: activeFirm._id } }); setDesigns((p) => p.filter((d) => d._id !== deleteTarget._id)); setDeleteTarget(null); } catch {} finally { setDeleteLoading(false); } };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "20px", md: "26px" } }}>Designs</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>All your embroidery designs</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddPhotoAlternateIcon />} onClick={() => setCreateOpen(true)}>Add Design</Button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: "16px" }} />)}
        </Box>
      ) : designs.length === 0 ? (
        <Paper elevation={0} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: "16px", p: 8, textAlign: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
            <BrushOutlinedIcon sx={{ color: "#4F46E5", fontSize: 30 }} />
          </Box>
          <Typography variant="h6" color="text.primary" mb={0.5}>No designs yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Add your first design to get started</Typography>
          <Button variant="contained" startIcon={<AddPhotoAlternateIcon />} onClick={() => setCreateOpen(true)}>Add Design</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2.5 }}>
          {designs.map((d) => (
            <Paper key={d._id} elevation={0} onClick={() => setViewDesign(d)} sx={{
              border: `1px solid ${theme.palette.divider}`, borderRadius: "16px", p: 2.5,
              transition: "all 0.2s ease", cursor: "pointer",
              "&:hover": { borderColor: theme.palette.primary.light, boxShadow: "0 12px 24px rgba(0,0,0,0.05)", transform: "translateY(-2px)" },
            }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: d.image_url ? "none" : "linear-gradient(135deg, #EEF2FF, #E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: d.image_url ? `1px solid ${theme.palette.divider}` : "none" }}>
                  {d.image_url ? <img src={d.image_url} alt={d.design_number} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <BrushOutlinedIcon sx={{ color: "#4F46E5", fontSize: 20 }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.primary" noWrap>{d.design_number}</Typography>
                  <Chip label={d.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={d.is_active ? "success" : "error"} sx={{ mt: 0.5, height: 20, fontSize: "10px", fontWeight: 700 }} />
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditDesign(d); }} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main } }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }} sx={{ color: theme.palette.text.secondary, "&:hover": { color: "#EF4444" } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Typography variant="body2" color="text.secondary"><PersonOutlineIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />Party: {d.vepari_id?.name || "Unknown"}</Typography>
                <Typography variant="body2" color="text.secondary">Parts: {d.parts?.length || 0}</Typography>
                <Typography variant="subtitle2" color="primary">Total/Pc: ₹{d.total_design_value || d.rate_per_piece || 0}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" color="text.primary">Add Design</Typography>
          <IconButton size="small" onClick={() => setCreateOpen(false)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}><DesignForm onSuccess={handleCreateSuccess} onCancel={() => setCreateOpen(false)} activeFirm={activeFirm} veparis={veparis} customParts={customParts} onPartAdded={(newPart) => setCustomParts(p => [...p, newPart])} /></DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editDesign)} onClose={() => setEditDesign(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" color="text.primary">Edit Design</Typography>
          <IconButton size="small" onClick={() => setEditDesign(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>{editDesign && <DesignForm onSuccess={handleEditSuccess} onCancel={() => setEditDesign(null)} activeFirm={activeFirm} editData={editDesign} veparis={veparis} customParts={customParts} onPartAdded={(newPart) => setCustomParts(p => [...p, newPart])} />}</DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.5 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "14px", backgroundColor: "error.light", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}>
            <WarningAmberIcon sx={{ color: "#EF4444", fontSize: 28 }} />
          </Box>
          <Typography variant="h6" color="text.primary">Delete Design?</Typography>
          <Typography variant="body2" color="text.secondary">Are you sure you want to delete <strong>{deleteTarget?.design_number}</strong>? This cannot be undone.</Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={handleDelete} disabled={deleteLoading} color="error">
            {deleteLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Design Details Popup */}
      <Dialog open={Boolean(viewDesign)} onClose={() => setViewDesign(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
          <Typography variant="subtitle1" fontWeight={700}>Design Details</Typography>
          <IconButton size="small" onClick={() => setViewDesign(null)} sx={{ color: theme.palette.text.secondary }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {viewDesign && (
            <Box>
              {/* Image Preview */}
              <Box sx={{ width: "100%", height: 320, backgroundColor: theme.palette.action.hover, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {viewDesign.image_url ? (
                  <img src={viewDesign.image_url} alt={viewDesign.design_number} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <Box sx={{ textAlign: "center", opacity: 0.3 }}>
                    <BrushOutlinedIcon sx={{ fontSize: 64, mb: 1, color: "primary.main" }} />
                    <Typography variant="body2">No Preview Available</Typography>
                  </Box>
                )}
                <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                  <Chip label={viewDesign.is_active ? "Active" : "Inactive"} size="small" variant="tonal" color={viewDesign.is_active ? "success" : "error"} sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                </Box>
              </Box>

              <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3.5 }}>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">{viewDesign.design_number}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <PersonOutlineIcon sx={{ fontSize: 18 }} /> Party: {viewDesign.vepari_id?.name || "Unknown"}
                  </Typography>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2.5 }}>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Parts</Typography>
                    <Typography variant="body1" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>{viewDesign.parts?.length || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Total Score</Typography>
                    <Typography variant="body1" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>₹{viewDesign.total_design_value || viewDesign.rate_per_piece || 0}</Typography>
                  </Box>
                  {viewDesign.stitch_count ? (
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Base Stitches</Typography>
                      <Typography variant="body1" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>{viewDesign.stitch_count?.toLocaleString()}</Typography>
                    </Box>
                  ) : null}
                </Box>
                
                {viewDesign.parts && viewDesign.parts.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Design Parts Details</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ mt: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: "10px" }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                          <TableRow>
                            <TableCell>Part</TableCell>
                            <TableCell>Stitches</TableCell>
                            <TableCell>Head</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell align="right">Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewDesign.parts.map((p, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{p.part_name}</TableCell>
                              <TableCell>{p.stitch_count?.toLocaleString()}</TableCell>
                              <TableCell>{p.head_count}</TableCell>
                              <TableCell>₹{p.stitch_rate}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(((p.stitch_count || 0) / 1000) * (p.head_count || 0) * (p.stitch_rate || 0)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {viewDesign.description && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Description</Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", p: 2, borderRadius: "12px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, fontStyle: "italic" }}>
                      "{viewDesign.description}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button fullWidth variant="contained" onClick={() => { setEditDesign(viewDesign); setViewDesign(null); }} startIcon={<EditOutlinedIcon />}>Edit Design</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
