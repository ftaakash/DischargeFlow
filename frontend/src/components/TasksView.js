import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Pill,
  Receipt,
  Calendar,
  GraduationCap,
  FileCheck,
  User,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const TasksView = ({ onRefreshNotifications }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [patientMap, setPatientMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
  const [updatingTask, setUpdatingTask] = useState(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    patient_id: '',
    title: '',
    description: '',
    category: 'documentation',
    assigned_role: 'nurse',
    priority: 2
  });

  const fetchTasks = useCallback(async () => {
    try {
      const [myRes, allRes, patientsRes] = await Promise.all([
        axios.get(`${API}/tasks/my`, { withCredentials: true }),
        axios.get(`${API}/tasks`, { withCredentials: true }),
        axios.get(`${API}/patients`, { withCredentials: true }),
      ]);
      setTasks(myRes.data);
      setAllTasks(allRes.data);
      // Build patient id → name lookup
      const map = {};
      patientsRes.data.forEach(p => { map[p.patient_id] = p.name; });
      setPatientMap(map);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdate = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus }, { withCredentials: true });
      if (newStatus === 'completed') {
        toast.success('Task completed', { description: 'Task has been marked as complete.' });
      } else if (newStatus === 'in_progress') {
        toast.info('Task in progress', { description: 'Task is now in progress.' });
      }
      fetchTasks();
      onRefreshNotifications();
    } catch (error) {
      console.error('Update task error:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.patient_id) {
      toast.error('Title and Patient are required');
      return;
    }
    setAddingTask(true);
    try {
      await axios.post(`${API}/tasks`, newTask, { withCredentials: true });
      setShowAddDialog(false);
      setNewTask({
        patient_id: '',
        title: '',
        description: '',
        category: 'documentation',
        assigned_role: 'nurse',
        priority: 2
      });
      fetchTasks();
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Add task error:', error);
      toast.error('Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  // Three-state toggle: pending → in_progress → completed → completed (locked)
  const handleCheckboxChange = (task) => {
    if (task.status === 'pending') {
      handleTaskUpdate(task.task_id, 'in_progress');
    } else if (task.status === 'in_progress') {
      handleTaskUpdate(task.task_id, 'completed');
    }
    // completed is locked
  };

  const getCategoryIcon = (category) => {
    const icons = {
      documentation: FileText,
      medication: Pill,
      billing: Receipt,
      follow_up: Calendar,
      education: GraduationCap,
    };
    return icons[category] || FileCheck;
  };

  const getPriorityClass = (priority) => {
    return priority === 1 ? 'priority-high' : priority === 2 ? 'priority-medium' : 'priority-low';
  };

  const displayTasks = viewMode === 'my' ? tasks : allTasks.filter(t => t.status !== 'completed');

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
            Tasks
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {viewMode === 'my' ? `${tasks.length} tasks assigned to you` : `${displayTasks.length} pending tasks`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['physician', 'nurse', 'admin'].includes(user?.role) && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="add-task-btn"
                  className="bg-blue-600 hover:bg-blue-500 text-white mr-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-zinc-50">Add New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="patient" className="text-zinc-300">Patient</Label>
                    <select
                      id="patient"
                      value={newTask.patient_id}
                      onChange={(e) => setNewTask({ ...newTask, patient_id: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md mt-1 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select a patient</option>
                      {Object.entries(patientMap).map(([id, name]) => (
                        <option key={id} value={id}>{name} (ID: {id.slice(-6)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="title" className="text-zinc-300">Task Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                      placeholder="Give meds, run tests, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-zinc-300">Description</Label>
                    <Input
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
                      placeholder="Additional details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-zinc-300">Category</Label>
                      <select
                        id="category"
                        value={newTask.category}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md mt-1 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="documentation">Documentation</option>
                        <option value="medication">Medication</option>
                        <option value="billing">Billing</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="education">Education</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="assigned_role" className="text-zinc-300">Assign To</Label>
                      <select
                        id="assigned_role"
                        value={newTask.assigned_role}
                        onChange={(e) => setNewTask({ ...newTask, assigned_role: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md mt-1 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="physician">Physician</option>
                        <option value="nurse">Nurse</option>
                        <option value="pharmacist">Pharmacist</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-zinc-300">Priority</Label>
                    <select
                      id="priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md mt-1 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>High</option>
                      <option value={2}>Medium</option>
                      <option value={3}>Low</option>
                    </select>
                  </div>
                  <Button 
                    onClick={handleAddTask}
                    disabled={addingTask || !newTask.title || !newTask.patient_id}
                    className="w-full bg-blue-600 hover:bg-blue-500"
                  >
                    {addingTask ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <button
            data-testid="view-my-tasks"
            onClick={() => setViewMode('my')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'my'
                ? 'bg-zinc-800 text-zinc-50'
                : 'text-zinc-400 hover:bg-zinc-800/50'
            }`}
          >
            My Tasks
          </button>
          <button
            data-testid="view-all-tasks"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-zinc-800 text-zinc-50'
                : 'text-zinc-400 hover:bg-zinc-800/50'
            }`}
          >
            All Tasks
          </button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-50">
                {displayTasks.filter(t => t.priority === 1).length}
              </p>
              <p className="text-xs text-zinc-500">High Priority</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Circle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-50">
                {displayTasks.filter(t => t.status === 'pending').length}
              </p>
              <p className="text-xs text-zinc-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-50">
                {displayTasks.filter(t => t.status === 'in_progress').length}
              </p>
              <p className="text-xs text-zinc-500">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Circle className="w-3 h-3 text-zinc-600" /> Pending (click once → In Progress)
        </span>
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-amber-400" /> In Progress (click again → Complete)
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
        </span>
      </div>

      {/* Tasks List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        {displayTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
            <p className="text-zinc-400">No pending tasks</p>
            <p className="text-sm text-zinc-500 mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {displayTasks.map((task) => {
              const Icon = getCategoryIcon(task.category);
              const isUpdating = updatingTask === task.task_id;
              const canEdit = task.assigned_role === user?.role || user?.role === 'admin';
              const patientName = patientMap[task.patient_id] || `Patient …${task.patient_id.slice(-6)}`;
              
              return (
                <div
                  key={task.task_id}
                  data-testid={`task-item-${task.task_id}`}
                  className={`p-4 hover:bg-zinc-800/30 transition-colors ${getPriorityClass(task.priority)}`}
                >
                  <div className="flex items-start gap-4">
                    {canEdit ? (
                      <button
                        data-testid={`task-check-${task.task_id}`}
                        disabled={isUpdating || task.status === 'completed'}
                        onClick={() => handleCheckboxChange(task)}
                        className="mt-1 flex-shrink-0 focus:outline-none"
                        aria-label="Toggle task status"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : task.status === 'in_progress' ? (
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400 transition-colors" />
                        )}
                      </button>
                    ) : (
                      <div className="mt-1">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : task.status === 'in_progress' ? (
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                        <span className={`font-medium ${task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-500">
                          <User className="w-3 h-3" />
                          {patientName}
                        </span>
                        <span className={`px-2 py-0.5 rounded capitalize ${
                          task.assigned_role === 'physician' ? 'bg-blue-500/10 text-blue-400' :
                          task.assigned_role === 'nurse' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {task.assigned_role}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${
                          task.priority === 1 ? 'bg-rose-500/10 text-rose-400' :
                          task.priority === 2 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          {task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                        </span>
                        <span className={`px-2 py-0.5 rounded capitalize ${
                          task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          task.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status}
                        </span>
                      </div>
                    </div>

                    {isUpdating && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksView;
