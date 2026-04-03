import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  User
} from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TasksView = ({ onRefreshNotifications }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
  const [updatingTask, setUpdatingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        axios.get(`${API}/tasks/my`, { withCredentials: true }),
        axios.get(`${API}/tasks`, { withCredentials: true })
      ]);
      setTasks(myRes.data);
      setAllTasks(allRes.data);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskUpdate = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus }, { withCredentials: true });
      fetchTasks();
      onRefreshNotifications();
    } catch (error) {
      console.error('Update task error:', error);
    } finally {
      setUpdatingTask(null);
    }
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
              
              return (
                <div
                  key={task.task_id}
                  data-testid={`task-item-${task.task_id}`}
                  className={`p-4 hover:bg-zinc-800/30 transition-colors ${getPriorityClass(task.priority)}`}
                >
                  <div className="flex items-start gap-4">
                    {canEdit ? (
                      <Checkbox
                        data-testid={`task-check-${task.task_id}`}
                        checked={task.status === 'completed'}
                        disabled={isUpdating || task.status === 'completed'}
                        onCheckedChange={(checked) => {
                          handleTaskUpdate(task.task_id, checked ? 'completed' : 'pending');
                        }}
                        className="mt-1"
                      />
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
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-zinc-500">
                          <User className="w-3 h-3" />
                          Patient ID: {task.patient_id.slice(-8)}
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
                      </div>
                    </div>

                    {isUpdating && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
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
