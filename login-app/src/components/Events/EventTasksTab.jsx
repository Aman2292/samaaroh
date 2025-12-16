import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Add, Calendar, User, Clock, Flag } from 'iconsax-react';
import { toast } from 'react-toastify';
import TaskModal from '../Tasks/TaskModal';

const EventTasksTab = ({ eventId, event }) => {
    const [tasks, setTasks] = useState({ todo: [], in_progress: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const teamMembers = [
        event.leadPlannerId,
        ...(event.assignedCoordinators || [])
    ].filter(Boolean);

    useEffect(() => {
        fetchTasks();
    }, [eventId]);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/tasks?eventId=${eventId}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const grouped = {
                    todo: [],
                    in_progress: [],
                    completed: []
                };
                data.data.tasks.forEach(task => {
                    if (grouped[task.status]) {
                        grouped[task.status].push(task);
                    }
                });
                setTasks(grouped);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        // Optimistic update
        const sourceColumn = [...tasks[source.droppableId]];
        const destColumn = [...tasks[destination.droppableId]];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        // Update task status locally
        const updatedTask = { ...movedTask, status: destination.droppableId };
        destColumn.splice(destination.index, 0, updatedTask);

        setTasks({
            ...tasks,
            [source.droppableId]: sourceColumn,
            [destination.droppableId]: destColumn
        });

        // API Call
        try {
            const response = await fetch(`http://localhost:5001/api/tasks/${draggableId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ status: destination.droppableId })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update task status');
            fetchTasks(); // Revert on error
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-blue-100 text-blue-700';
            case 'low': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const [focusMode, setFocusMode] = useState(false);

    const checkDueSoon = (date) => {
        if (!date) return false;
        const diff = new Date(date) - new Date();
        const hours = diff / (1000 * 60 * 60);
        return hours > 0 && hours <= 48;
    };

    const isDueToday = (date) => {
        if (!date) return false;
        const taskDate = new Date(date);
        const today = new Date();
        return taskDate.getDate() === today.getDate() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear();
    };

    const handleLoadDefaults = async () => {
        if (!window.confirm('Load default wedding checklist?')) return;

        const defaultTasks = [
            { title: 'Confirm Wedding Venue', priority: 'urgent', status: 'todo' },
            { title: 'Finalize Guest List', priority: 'high', status: 'todo' },
            { title: 'Book Photographer', priority: 'high', status: 'todo' },
            { title: 'Select Decor Theme', priority: 'medium', status: 'todo' },
            { title: 'Send Invitations', priority: 'high', status: 'todo' },
            { title: 'Arrange Transportation', priority: 'medium', status: 'todo' },
        ];

        try {
            setLoading(true);
            const promises = defaultTasks.map(task =>
                fetch('http://localhost:5001/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify({ ...task, eventId })
                })
            );
            await Promise.all(promises);
            toast.success('Default checklist loaded!');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to load defaults');
        } finally {
            setLoading(false);
        }
    };

    const TaskCard = ({ task, index }) => {
        const dueSoon = checkDueSoon(task.dueDate);

        return (
            <Draggable draggableId={task._id} index={index}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => {
                            setSelectedTask(task);
                            setShowModal(true);
                        }}
                        className={`
                        bg-white p-4 rounded-lg shadow-sm border mb-3 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden
                        ${dueSoon ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-slate-200'}
                    `}
                    >
                        {dueSoon && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                DUE SOON
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getPriorityColor(task.priority)} capitalize`}>
                                {task.priority}
                            </span>
                            {task.dueDate && (
                                <div className={`flex items-center text-xs ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                    <Clock size="14" className="mr-1" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                        <h4 className="font-medium text-slate-800 mb-1 line-clamp-2">{task.title}</h4>
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center text-slate-500 text-xs">
                                <User size="14" className="mr-1" />
                                {task.assignedTo?.name || 'Unassigned'}
                            </div>
                        </div>
                    </div>
                )}
            </Draggable>
        )
    };

    const Column = ({ title, id, tasks }) => (
        <div className="bg-slate-50 p-4 rounded-xl min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">{title}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </div>
            <Droppable droppableId={id}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1"
                    >
                        {tasks.map((task, index) => (
                            <TaskCard key={task._id} task={task} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );

    // Apply Focus Mode Filter
    const filterTasks = (taskList) => {
        if (!focusMode) return taskList;
        return taskList.filter(t => isDueToday(t.dueDate));
    };

    const hasTasks = tasks.todo.length > 0 || tasks.in_progress.length > 0 || tasks.completed.length > 0;

    return (
        <div className="h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Task Board</h2>
                    <p className="text-sm text-slate-500">Manage your event tasks</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setFocusMode(!focusMode)}
                        className={`
                            flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border
                            ${focusMode
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                        `}
                    >
                        <Flag size="20" variant={focusMode ? "Bold" : "Outline"} />
                        <span>Focus Mode (Today)</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedTask(null);
                            setShowModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Add size="20" color="#ffffff" variant="Outline" />
                        <span>Add Task</span>
                    </button>
                </div>
            </div>

            {!hasTasks && !loading ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="mb-4">
                        <Flag size="48" className="mx-auto text-slate-300" variant="Bulk" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No tasks yet</h3>
                    <p className="text-slate-500 mb-6">Start by adding a task or load a template.</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleLoadDefaults}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Load Wedding Checklist
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Create First Task
                        </button>
                    </div>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Column title="To Do" id="todo" tasks={filterTasks(tasks.todo)} />
                        <Column title="In Progress" id="in_progress" tasks={filterTasks(tasks.in_progress)} />
                        <Column title="Completed" id="completed" tasks={filterTasks(tasks.completed)} />
                    </div>
                </DragDropContext>
            )}

            <TaskModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                task={selectedTask}
                events={[event]}
                teamMembers={teamMembers}
                taskStatuses={[
                    { value: 'todo', label: 'To Do', color: '#64748b', bgColor: '#f1f5f9' },
                    { value: 'in_progress', label: 'In Progress', color: '#eab308', bgColor: '#fef9c3' },
                    { value: 'completed', label: 'Completed', color: '#22c55e', bgColor: '#dcfce7' }
                ]}
                onSuccess={fetchTasks}
            />
        </div>
    );
};

export default EventTasksTab;
