import React, { useState } from 'react';
import { X } from 'lucide-react';
import DynamicListInput from '../common/DynamicListInput';

const Step1_CourseInfo = ({
    courseData,
    handleInputChange,
    categoriesList,
    updateCategories,
    handleArrayAction
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingNewCat, setIsAddingNewCat] = useState(false);

    const handleSelectCategory = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        if (selectedId === 'custom_new') {
            setIsAddingNewCat(true);
            return;
        }
        // Check trùng lặp
        if (!courseData.categories.some(cat => cat.value === selectedId)) {
            const catObj = categoriesList.find(c => c._id === selectedId);
            if (catObj) {
                updateCategories([...courseData.categories, { value: selectedId, label: catObj.name, isNew: false }]);
            }
        }
    };

    const handleAddCustomCategory = () => {
        if (!newCategoryName.trim()) return;
        if (!courseData.categories.some(cat => cat.label.toLowerCase() === newCategoryName.toLowerCase())) {
            updateCategories([...courseData.categories, { value: newCategoryName, label: newCategoryName, isNew: true }]);
        }
        setNewCategoryName('');
        setIsAddingNewCat(false);
    };

    const removeCategory = (idx) => {
        updateCategories(courseData.categories.filter((_, index) => index !== idx));
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Course Information</h2>

            {/* Title */}
            <div>
                <label className="block text-sm font-bold mb-2">Course Title <span className="text-red-500">*</span></label>
                <input type="text" name="title" value={courseData.title} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Complete Python Bootcamp" />
            </div>

            {/* Categories, Level, Language */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                    <label className="block text-sm font-bold mb-2">Categories <span className="text-red-500">*</span></label>

                    {/* Tags Display */}
                    <div className="flex flex-wrap gap-2 mb-3 p-3 border rounded-lg bg-gray-50 min-h-[50px]">
                        {courseData.categories.length === 0 && <span className="text-gray-400 text-sm py-1">No categories selected</span>}
                        {courseData.categories.map((cat, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 border ${cat.isNew ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                {cat.label}
                                <X size={14} className="cursor-pointer hover:text-red-600" onClick={() => removeCategory(idx)} />
                            </span>
                        ))}
                    </div>

                    {/* Select Input */}
                    {!isAddingNewCat ? (
                        <select onChange={handleSelectCategory} className="w-full px-4 py-3 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value="">
                            <option value="" disabled>Select a category to add...</option>
                            {categoriesList.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                            <option value="custom_new" className="font-bold text-blue-600 bg-blue-50">+ Create New Category</option>
                        </select>
                    ) : (
                        <div className="flex gap-2 animate-fadeIn">
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Type new category name..." className="flex-1 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 border-green-300" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()} />
                            <button onClick={handleAddCustomCategory} className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Add</button>
                            <button onClick={() => { setIsAddingNewCat(false); setNewCategoryName(''); }} className="px-4 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">You can select multiple categories or create new ones.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Level</label>
                    <select name="level" value={courseData.level} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg outline-none bg-white">
                        <option value="alllevels">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Language</label>
                    <select name="language" value={courseData.language} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg outline-none bg-white">
                        <option value="vn">Vietnamese</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold mb-2">Short Description</label>
                <textarea name="shortDescription" value={courseData.shortDescription} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg h-24 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief summary..."></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DynamicListInput title="What will students learn?" items={courseData.learnOutcomes} placeholder="e.g. Build apps" onAdd={() => handleArrayAction('learnOutcomes', 'add')} onRemove={(idx) => handleArrayAction('learnOutcomes', 'remove', idx)} onChange={(idx, val) => handleArrayAction('learnOutcomes', 'update', idx, val)} />
                <DynamicListInput title="Target Audience" items={courseData.audience} placeholder="e.g. Beginners" onAdd={() => handleArrayAction('audience', 'add')} onRemove={(idx) => handleArrayAction('audience', 'remove', idx)} onChange={(idx, val) => handleArrayAction('audience', 'update', idx, val)} />
            </div>
        </div>
    );
};

export default Step1_CourseInfo;