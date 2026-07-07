// src/components/instructor/Step3_Curriculum.jsx
import React, { useState } from 'react';
import {
    PlusCircle, LayoutList, Edit2, Trash2, Check, PlayCircle,
    Video, FileText, Lock, Eye, Cloud, GripVertical, AlertCircle
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

// ======================== STEP 3 CURRICULUM ========================
const Step3_Curriculum = ({
    sections,
    addSection,
    updateSection,
    removeSection,
    openLessonModal,
    deleteLecture,
    setCourseData,
    errorFields = {}  // { sections }
}) => {
    const [activeSectionId, setActiveSectionId] = useState(null);

    const totalLectures = sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0);
    const totalDuration = sections.reduce((acc, s) =>
        acc + (s.lectures || []).reduce((a, l) => a + (l.duration || 0), 0), 0
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Reorder sections
    const handleSectionDragEnd = (event) => {
        const { active, over } = event;
        setActiveSectionId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = sections.findIndex((_, i) => `section-${i}` === active.id);
        const newIdx = sections.findIndex((_, i) => `section-${i}` === over.id);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({
            ...s, order: i
        }));
        setCourseData(prev => ({ ...prev, sections: reordered }));
    };

    // Reorder lectures inside a section
    const handleLectureDragEnd = (sIdx, event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const lectures = sections[sIdx].lectures || [];
        const oldIdx = lectures.findIndex((_, i) => `lec-${sIdx}-${i}` === active.id);
        const newIdx = lectures.findIndex((_, i) => `lec-${sIdx}-${i}` === over.id);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = arrayMove(lectures, oldIdx, newIdx).map((l, i) => ({
            ...l, order: i
        }));
        updateSection(sIdx, { lectures: reordered });
    };

    const sectionIds = sections.map((_, i) => `section-${i}`);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nội dung khóa học</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {sections.length} section • {totalLectures} bài học •{' '}
                        <span className="text-rose-500 font-medium">{formatDuration(totalDuration)}</span> tổng
                        {sections.length > 1 && (
                            <span className="ml-2 text-gray-300">· Kéo <GripVertical size={12} className="inline" /> để sắp xếp</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={addSection}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm text-sm font-semibold"
                >
                    <PlusCircle size={16} /> Thêm chương
                </button>
            </div>

            {/* Empty state */}
            {sections.length === 0 && (
                <div className={`text-center py-16 border-2 border-dashed rounded-2xl transition-all ${errorFields.sections
                    ? 'border-red-400 bg-red-50/40 ring-2 ring-red-300'
                    : 'border-gray-200 bg-gray-50'
                    }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${errorFields.sections ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                        {errorFields.sections
                            ? <AlertCircle size={24} className="text-red-400" />
                            : <LayoutList size={24} className="text-gray-300" />}
                    </div>
                    <p className={`font-semibold mb-1 ${errorFields.sections ? 'text-red-600' : 'text-gray-500'
                        }`}>
                        {errorFields.sections ? 'Cần thêm ít nhất 1 chương!' : 'Chưa có chương nào'}
                    </p>
                    <p className={`text-sm mb-4 ${errorFields.sections ? 'text-red-500' : 'text-gray-400'
                        }`}>
                        {errorFields.sections || 'Nhấn "Thêm chương" để bắt đầu xây dựng nội dung'}
                    </p>
                    <button
                        onClick={addSection}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold text-sm transition-colors"
                    >
                        <PlusCircle size={16} /> Tạo chương đầu tiên
                    </button>
                </div>
            )}

            {/* Section List with Drag */}
            {sections.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => setActiveSectionId(active.id)}
                    onDragEnd={handleSectionDragEnd}
                >
                    <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {sections.map((section, sIdx) => (
                                <SortableSectionCard
                                    key={`section-${sIdx}`}
                                    id={`section-${sIdx}`}
                                    section={section}
                                    sIdx={sIdx}
                                    updateSection={updateSection}
                                    removeSection={removeSection}
                                    openLessonModal={openLessonModal}
                                    deleteLecture={deleteLecture}
                                    onLectureDragEnd={(e) => handleLectureDragEnd(sIdx, e)}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Drag Overlay for sections */}
                    <DragOverlay>
                        {activeSectionId && (() => {
                            const idx = sections.findIndex((_, i) => `section-${i}` === activeSectionId);
                            if (idx === -1) return null;
                            return (
                                <div className="border-2 border-rose-300 rounded-2xl bg-white shadow-2xl opacity-90 p-4">
                                    <p className="font-semibold text-rose-600 text-sm">
                                        ✦ {sections[idx].title || '(Chưa đặt tên)'}
                                    </p>
                                </div>
                            );
                        })()}
                    </DragOverlay>
                </DndContext>
            )}

            {sections.length > 0 && (
                <button
                    onClick={addSection}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-rose-600 hover:border-rose-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                    <PlusCircle size={16} /> Thêm chương mới
                </button>
            )}
        </div>
    );
};

// ======================== SORTABLE SECTION CARD ========================
const SortableSectionCard = ({
    id, section, sIdx, updateSection, removeSection,
    openLessonModal, deleteLecture, onLectureDragEnd
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : 'auto'
    };

    const sectionDuration = (section.lectures || []).reduce((a, l) => a + (l.duration || 0), 0);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const lectureIds = (section.lectures || []).map((_, i) => `lec-${sIdx}-${i}`);

    return (
        <div ref={setNodeRef} style={style} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Section Header */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center gap-3 border-b border-gray-100 group">
                {/* Drag Handle for section */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-rose-400 transition-colors flex-shrink-0 touch-none"
                    title="Kéo để sắp xếp section"
                >
                    <GripVertical size={18} />
                </div>

                <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-rose-600">{sIdx + 1}</span>
                </div>

                {section.isEditing ? (
                    <div className="flex flex-1 gap-2">
                        <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                            className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-rose-200 text-sm font-medium"
                            placeholder="Tên chương..."
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && updateSection(sIdx, { isEditing: false })}
                        />
                        <button
                            onClick={() => updateSection(sIdx, { isEditing: false })}
                            className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            <Check size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                            {section.title || '(Chưa đặt tên chương)'}
                        </span>
                        <span className="text-xs text-gray-400">
                            • {section.lectures?.length || 0} bài • {formatDuration(sectionDuration)}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!section.isEditing && (
                        <button
                            onClick={() => updateSection(sIdx, { isEditing: true })}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Đổi tên"
                        >
                            <Edit2 size={15} />
                        </button>
                    )}
                    <button
                        onClick={() => removeSection(sIdx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Xóa chương"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Lecture List with Drag */}
            <div className="p-4 space-y-2">
                {section.lectures && section.lectures.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onLectureDragEnd}
                    >
                        <SortableContext items={lectureIds} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {section.lectures.map((lec, lIdx) => (
                                    <SortableLectureRow
                                        key={`lec-${sIdx}-${lIdx}`}
                                        id={`lec-${sIdx}-${lIdx}`}
                                        lecture={lec}
                                        lIdx={lIdx}
                                        sIdx={sIdx}
                                        onEdit={() => openLessonModal(sIdx, lIdx)}
                                        onDelete={() => deleteLecture(sIdx, lIdx)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Video size={16} className="text-gray-300" />
                        <span className="text-sm text-gray-400 italic">Chưa có bài học nào</span>
                    </div>
                )}

                {/* Add Lecture Button */}
                <button
                    onClick={() => openLessonModal(sIdx, null)}
                    className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 text-sm text-rose-600 font-semibold hover:bg-rose-50 rounded-xl transition-colors border border-dashed border-rose-200 hover:border-rose-400"
                >
                    <PlusCircle size={16} /> Thêm bài học (Video)
                </button>
            </div>
        </div>
    );
};

// ======================== SORTABLE LECTURE ROW ========================
const SortableLectureRow = ({ id, lecture, lIdx, sIdx, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1
    };

    const isS3Video = lecture.videoUrl && lecture.videoUrl.includes('cloudfront.net');
    const hasVideo = !!lecture.videoUrl;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 bg-white border rounded-xl transition-all group
                ${isDragging ? 'border-rose-300 shadow-lg' : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/30'}`}
        >
            {/* Drag Handle for lecture */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-rose-300 mr-2 flex-shrink-0 touch-none transition-colors"
                title="Kéo để sắp xếp bài học"
            >
                <GripVertical size={15} />
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Video indicator */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${hasVideo ? 'bg-rose-100' : 'bg-gray-100'}`}>
                    <PlayCircle size={14} className={hasVideo ? 'text-rose-500' : 'text-gray-400'} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-800 truncate">{lecture.title || '(Chưa đặt tên)'}</p>
                        {lecture.isPreviewFree && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded border border-amber-200 flex-shrink-0">
                                <Eye size={10} /> Preview
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span>⏱ {formatDuration(lecture.duration)}</span>
                        {lecture.resources?.length > 0 && (
                            <span className="flex items-center gap-1 text-indigo-500">
                                <FileText size={11} /> {lecture.resources.length} tài liệu
                            </span>
                        )}
                        {isS3Video && (
                            <span className="flex items-center gap-1 text-blue-500">
                                <Cloud size={11} />
                            </span>
                        )}
                        {!hasVideo && (
                            <span className="text-orange-400 font-medium">⚠ Chưa có video</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                    onClick={onEdit}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                    title="Chỉnh sửa bài học"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Xóa bài học"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export default Step3_Curriculum;