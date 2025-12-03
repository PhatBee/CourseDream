import React from 'react';
import { PlusCircle, LayoutList, Edit2, Trash2, Check, PlayCircle } from 'lucide-react';

const Step3_Curriculum = ({
    sections,
    addSection,
    updateSection,
    removeSection,
    openLessonModal,
    deleteLecture
}) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold">Curriculum</h2>
                <button onClick={addSection} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow">
                    <PlusCircle size={18} /> New Section
                </button>
            </div>

            {sections.length === 0 && <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">No sections yet. Start by adding one!</div>}

            {sections.map((section, sIdx) => (
                <div key={sIdx} className="border border-gray-200 rounded-lg overflow-hidden mb-5 shadow-sm bg-white">
                    {/* Section Header */}
                    <div className="bg-gray-100 p-4 flex items-center gap-3 border-b group">
                        <LayoutList size={20} className="text-gray-500" />
                        <span className="font-bold text-gray-700 whitespace-nowrap">Section {sIdx + 1}:</span>

                        {section.isEditing ? (
                            <div className="flex flex-1 gap-2">
                                <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                                    className="flex-1 bg-white border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                                    placeholder="Section Title..."
                                    autoFocus
                                />
                                <button onClick={() => updateSection(sIdx, { isEditing: false })} className="bg-green-500 text-white p-1 rounded hover:bg-green-600"><Check size={16} /></button>
                            </div>
                        ) : (
                            <span className="flex-1 font-medium text-gray-800">{section.title || "(Untitled Section)"}</span>
                        )}

                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {!section.isEditing && (
                                <button onClick={() => updateSection(sIdx, { isEditing: true })} className="text-gray-500 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                            )}
                            <button onClick={() => removeSection(sIdx)} className="text-gray-500 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                        </div>
                    </div>

                    {/* Lecture List */}
                    <div className="p-4">
                        {section.lectures.map((lec, lIdx) => (
                            <div key={lIdx} className="flex items-center justify-between p-3 mb-2 bg-gray-50 border rounded-lg hover:bg-blue-50 transition">
                                <div className="flex items-center gap-3">
                                    <PlayCircle className="text-blue-500" size={20} />
                                    <div>
                                        <p className="font-medium text-sm text-gray-800">{lec.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {lec.duration} sec • {lec.resources?.length || 0} resources • {lec.isPreviewFree ? 'Free Preview' : 'Locked'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openLessonModal(sIdx, lIdx)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                                    <button onClick={() => deleteLecture(sIdx, lIdx)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => openLessonModal(sIdx, null)} className="mt-2 text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline">
                            <PlusCircle size={16} /> Add Lesson Content
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Step3_Curriculum;