import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  User, 
  Calendar, 
  MapPin,
  Activity,
  ArrowRight,
  Loader2,
  Stethoscope
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PatientList = ({ onPatientSelect, onWorkflowSelect }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    date_of_birth: '',
    admission_date: '',
    room_number: '',
    diagnosis: '',
    attending_physician: ''
  });

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API}/patients`, { withCredentials: true });
      setPatients(res.data);
    } catch (error) {
      console.error('Fetch patients error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async () => {
    setAddingPatient(true);
    try {
      await axios.post(`${API}/patients`, newPatient, { withCredentials: true });
      setShowAddDialog(false);
      setNewPatient({
        name: '',
        date_of_birth: '',
        admission_date: '',
        room_number: '',
        diagnosis: '',
        attending_physician: ''
      });
      fetchPatients();
    } catch (error) {
      console.error('Add patient error:', error);
    } finally {
      setAddingPatient(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      admitted: 'status-admitted',
      pending_discharge: 'status-pending',
      discharged: 'status-discharged',
    };
    const labels = {
      admitted: 'Admitted',
      pending_discharge: 'Pending Discharge',
      discharged: 'Discharged',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canAddPatient = ['physician', 'nurse', 'admin'].includes(user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Patients
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {patients.length} total patients
          </p>
        </div>
        {canAddPatient && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                data-testid="add-patient-btn"
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-50">Add New Patient</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-zinc-300">Patient Name</Label>
                    <Input
                      id="name"
                      data-testid="patient-name-input"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob" className="text-zinc-300">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      data-testid="patient-dob-input"
                      value={newPatient.date_of_birth}
                      onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admission" className="text-zinc-300">Admission Date</Label>
                    <Input
                      id="admission"
                      type="date"
                      data-testid="patient-admission-input"
                      value={newPatient.admission_date}
                      onChange={(e) => setNewPatient({ ...newPatient, admission_date: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room" className="text-zinc-300">Room Number</Label>
                    <Input
                      id="room"
                      data-testid="patient-room-input"
                      value={newPatient.room_number}
                      onChange={(e) => setNewPatient({ ...newPatient, room_number: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                      placeholder="e.g., 301A"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="diagnosis" className="text-zinc-300">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    data-testid="patient-diagnosis-input"
                    value={newPatient.diagnosis}
                    onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                    placeholder="Primary diagnosis"
                  />
                </div>
                <div>
                  <Label htmlFor="physician" className="text-zinc-300">Attending Physician</Label>
                  <Input
                    id="physician"
                    data-testid="patient-physician-input"
                    value={newPatient.attending_physician}
                    onChange={(e) => setNewPatient({ ...newPatient, attending_physician: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                    placeholder="Dr. Name"
                  />
                </div>
                <Button 
                  data-testid="submit-patient-btn"
                  onClick={handleAddPatient}
                  disabled={addingPatient || !newPatient.name}
                  className="w-full bg-blue-600 hover:bg-blue-500"
                >
                  {addingPatient ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Add Patient
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            data-testid="patient-search"
            placeholder="Search patients by name, room, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'admitted', 'pending_discharge', 'discharged'].map((status) => (
            <button
              key={status}
              data-testid={`filter-${status}`}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              {status === 'all' ? 'All' : status === 'pending_discharge' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient.patient_id}
            data-testid={`patient-card-${patient.patient_id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors cursor-pointer"
            onClick={() => onPatientSelect(patient)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100">{patient.name}</h3>
                  <p className="text-xs text-zinc-500">ID: {patient.patient_id.slice(-8)}</p>
                </div>
              </div>
              {getStatusBadge(patient.status)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                <span>Room {patient.room_number}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Activity className="w-4 h-4" strokeWidth={1.5} />
                <span className="truncate">{patient.diagnosis}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Stethoscope className="w-4 h-4" strokeWidth={1.5} />
                <span>{patient.attending_physician}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4" strokeWidth={1.5} />
                <span>Admitted {new Date(patient.admission_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">No patients found</p>
          <p className="text-sm text-zinc-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default PatientList;
