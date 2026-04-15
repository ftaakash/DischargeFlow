import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin,
  Activity,
  Stethoscope,
  Play,
  Loader2,
  ClipboardList,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PatientDetails = ({ patient, onBack, onWorkflowSelect, onRefreshNotifications }) => {
  const { user } = useAuth();
  const [localPatient, setLocalPatient] = useState(patient);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    setLocalPatient(patient);
  }, [patient]);

  const fetchWorkflow = async () => {
    try {
      const res = await axios.get(`${API}/workflows/patient/${patient.patient_id}`, { withCredentials: true });
      setWorkflow(res.data);
    } catch (error) {
      console.error('Fetch workflow error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [patient.patient_id]);

  const handleInitiateDischarge = async () => {
    setInitiating(true);
    try {
      const res = await axios.post(`${API}/workflows/initiate/${localPatient.patient_id}`, {}, { withCredentials: true });
      setWorkflow(res.data.workflow);
      onRefreshNotifications();
    } catch (error) {
      console.error('Initiate discharge error:', error);
      alert(error.response?.data?.detail || 'Failed to initiate discharge');
    } finally {
      setInitiating(false);
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
      <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleStatusChange = async (newStatus) => {
    const backup = localPatient.status;
    try {
      setLocalPatient({ ...localPatient, status: newStatus });
      await axios.put(`${API}/patients/${localPatient.patient_id}`, { status: newStatus }, { withCredentials: true });
      onRefreshNotifications();
    } catch (error) {
      console.error('Update status error:', error);
      setLocalPatient({ ...localPatient, status: backup });
      alert('Failed to update status');
    }
  };

  const canEditStatus = ['physician', 'nurse', 'admin'].includes(user?.role);
  const canInitiateDischarge = ['physician', 'admin'].includes(user?.role) && localPatient.status === 'admitted';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        data-testid="back-to-patients"
        variant="ghost"
        onClick={onBack}
        className="text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Patients
      </Button>

      {/* Patient Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {localPatient.name}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Patient ID: {localPatient.patient_id}</p>
              <div className="mt-2">
                {canEditStatus ? (
                  <select
                    value={localPatient.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-zinc-800 text-zinc-100 text-sm rounded border border-zinc-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="admitted">Admitted</option>
                    <option value="pending_discharge">Pending Discharge</option>
                    <option value="discharged">Discharged</option>
                  </select>
                ) : (
                  getStatusBadge(localPatient.status)
                )}
              </div>
            </div>
          </div>
          
          {canInitiateDischarge && (
            <Button
              data-testid="initiate-discharge-btn"
              onClick={handleInitiateDischarge}
              disabled={initiating}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {initiating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Initiate Discharge
            </Button>
          )}
        </div>

        {/* Patient Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Room</p>
            <div className="flex items-center gap-2 text-zinc-200">
              <MapPin className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              {patient.room_number}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Date of Birth</p>
            <div className="flex items-center gap-2 text-zinc-200">
              <Calendar className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              {new Date(patient.date_of_birth).toLocaleDateString()}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Admission Date</p>
            <div className="flex items-center gap-2 text-zinc-200">
              <Calendar className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              {new Date(patient.admission_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Attending Physician</p>
            <div className="flex items-center gap-2 text-zinc-200">
              <Stethoscope className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              {patient.attending_physician}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Diagnosis</p>
          <div className="flex items-center gap-2 text-zinc-200">
            <Activity className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            {patient.diagnosis}
          </div>
        </div>
      </div>

      {/* Workflow Section */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : workflow ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
              <h2 className="text-lg font-medium text-zinc-50">Discharge Workflow</h2>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              workflow.status === 'completed' ? 'status-completed' :
              workflow.status === 'pending_approval' ? 'status-pending' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {workflow.status === 'in_progress' ? 'In Progress' :
               workflow.status === 'pending_approval' ? 'Pending Approval' :
               workflow.status === 'completed' ? 'Completed' : workflow.status}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-400 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Started: {new Date(workflow.started_at).toLocaleString()}
            </div>
            {workflow.estimated_discharge_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Est. Discharge: {new Date(workflow.estimated_discharge_time).toLocaleString()}
              </div>
            )}
          </div>

          {/* Task Summary */}
          {workflow.tasks && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-zinc-50">
                  {workflow.tasks.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-xs text-zinc-500">Completed</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-amber-400">
                  {workflow.tasks.filter(t => t.status === 'in_progress').length}
                </p>
                <p className="text-xs text-zinc-500">In Progress</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-zinc-400">
                  {workflow.tasks.filter(t => t.status === 'pending').length}
                </p>
                <p className="text-xs text-zinc-500">Pending</p>
              </div>
            </div>
          )}

          <Button
            data-testid="view-workflow-btn"
            onClick={() => onWorkflowSelect(workflow)}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            View Full Workflow
          </Button>
        </div>
      ) : localPatient.status === 'admitted' ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 mb-2">No discharge workflow initiated</p>
          {canInitiateDischarge && (
            <p className="text-sm text-zinc-500">
              Click "Initiate Discharge" to start the discharge process
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PatientDetails;
