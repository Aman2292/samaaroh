import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, User, Location } from 'iconsax-react';

const EventsKanban = ({ events, onStatusChange, canEdit }) => {
    const statuses = ['lead', 'booked', 'in_progress', 'completed', 'cancelled'];

    const getStatusColor = (status) => {
        const colors = {
            lead: 'bg-blue-50 text-blue-700 border-blue-200',
            booked: 'bg-green-50 text-green-700 border-green-200',
            in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            completed: 'bg-gray-50 text-gray-700 border-gray-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusTitle = (status) => {
        return status.replace('_', ' ').toUpperCase();
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;
        if (source.droppableId !== newStatus) {
            onStatusChange(draggableId, newStatus);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex overflow-x-auto pb-4 gap-6 h-[calc(100vh-250px)]">
                {statuses.map(status => {
                    const statusEvents = events.filter(e => e.status === status);

                    return (
                        <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-slate-50 rounded-xl border border-slate-200 max-h-full">
                            <div className={`p-4 border-b border-slate-200 font-semibold flex justify-between items-center sticky top-0 rounded-t-xl z-10 ${getStatusColor(status)} bg-opacity-50`}>
                                <span className="text-sm tracking-wide">{getStatusTitle(status)}</span>
                                <span className="bg-white bg-opacity-60 px-2.5 py-0.5 rounded-full text-xs font-bold border border-current opacity-80">
                                    {statusEvents.length}
                                </span>
                            </div>

                            <Droppable droppableId={status} isDropDisabled={!canEdit}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`p-3 space-y-3 overflow-y-auto flex-1 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100/50' : ''
                                            }`}
                                    >
                                        {statusEvents.map((event, index) => (
                                            <Draggable
                                                key={event._id}
                                                draggableId={event._id}
                                                index={index}
                                                isDragDisabled={!canEdit}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-white p-4 rounded-lg border border-slate-200 group hover:border-primary-200 hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary-500 rotate-2 scale-105 z-50' : 'shadow-sm'
                                                            }`}
                                                        style={provided.draggableProps.style}
                                                    >
                                                        <h4 className="font-semibold text-slate-800 mb-3 leading-tight">
                                                            {event.eventName}
                                                        </h4>

                                                        <div className="space-y-2.5 text-xs text-slate-500">
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar size="14" className="text-slate-400 flex-shrink-0" />
                                                                <span>{new Date(event.eventDate).toLocaleDateString('en-IN', {
                                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                                })}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <User size="14" className="text-slate-400 flex-shrink-0" />
                                                                <span className="truncate">{event.clientId?.name || 'No Client'}</span>
                                                            </div>
                                                            {event.venue && (
                                                                <div className="flex items-center space-x-2">
                                                                    <Location size="14" className="text-slate-400 flex-shrink-0" />
                                                                    <span className="truncate">{event.venue}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {!canEdit && (
                                                            <div className="mt-3 pt-2 border-t border-slate-50 text-[10px] text-slate-400 italic text-center">
                                                                Read only
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
};

export default EventsKanban;
