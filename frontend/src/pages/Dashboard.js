import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PatientList from '../components/PatientList';
import PatientDetails from '../components/PatientDetails';
import WorkflowView from '../components/WorkflowView';
import TasksView from '../components/TasksView';
import AnalyticsView from '../components/AnalyticsView';
import AdminView from '../components/AdminView';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Seed data if needed
        await axios.post(`${API}/seed`, {}, { withCredentials: true });
        // Fetch notifications
        const notifRes = await axios.get(`${API}/notifications`, { withCredentials: true });
        setNotifications(notifRes.data);
        setUnreadCount(notifRes.data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, { withCredentials: true });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setActiveView('patient-details');
  };

  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
    setActiveView('workflow');
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setSelectedWorkflow(null);
    setActiveView('patients');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'patient-details':
        return (
          <PatientDetails 
            patient={selectedPatient} 
            onBack={handleBack}
            onWorkflowSelect={handleWorkflowSelect}
            onRefreshNotifications={fetchNotifications}
          />
        );
      case 'workflow':
        return (
          <WorkflowView 
            workflow={selectedWorkflow} 
            onBack={handleBack}
            onRefreshNotifications={fetchNotifications}
          />
        );
      case 'tasks':
        return <TasksView onRefreshNotifications={fetchNotifications} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'admin':
        return <AdminView />;
      default:
        return (
          <PatientList 
            onPatientSelect={handlePatientSelect}
            onWorkflowSelect={handleWorkflowSelect}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        user={user}
      />
      <div className="flex-1 flex flex-col">
        <Header 
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationRead={fetchNotifications}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
