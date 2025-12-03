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

    const TaskCard = ({ task, index }) => (
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
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-3 hover:shadow-md transition-shadow cursor-pointer"
                >
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
    );

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

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Task Board</h2>
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

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Column title="To Do" id="todo" tasks={tasks.todo} />
                    <Column title="In Progress" id="in_progress" tasks={tasks.in_progress} />
                    <Column title="Completed" id="completed" tasks={tasks.completed} />
                </div>
            </DragDropContext>

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
