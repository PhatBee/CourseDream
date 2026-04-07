import React from 'react';
import { AlertCircle } from 'lucide-react';
import DynamicListInput from '../common/DynamicListInput';

const FieldError = ({ msg }) =>
    msg ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500 font-medium animate-fadeIn">
            <AlertCircle size={12} className="flex-shrink-0" /> {msg}
        </p>
    ) : null;

const Step4_Details = ({
    courseData,
    handleInputChange,
    handleArrayAction,
    errorFields = {}   // { requirements }
}) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Additional Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements - BẮT BUỘC */}
                <DynamicListInput
                    title="Requirements"
                    items={courseData.requirements}
                    placeholder="e.g. Basic HTML knowledge"
                    onAdd={() => handleArrayAction('requirements', 'add')}
                    onRemove={(idx) => handleArrayAction('requirements', 'remove', idx)}
                    onChange={(idx, val) => handleArrayAction('requirements', 'update', idx, val)}
                    hasError={!!errorFields.requirements}
                    errorMsg={errorFields.requirements}
                />

                {/* Course Includes */}
                <DynamicListInput
                    title="Course Includes"
                    items={courseData.includes}
                    placeholder="e.g. 10 hours video, Certificate"
                    onAdd={() => handleArrayAction('includes', 'add')}
                    onRemove={(idx) => handleArrayAction('includes', 'remove', idx)}
                    onChange={(idx, val) => handleArrayAction('includes', 'update', idx, val)}
                />
            </div>

            {/* Detailed Description */}
            <div>
                <label className="block text-sm font-bold mb-2">Detailed Description</label>
                <textarea
                    name="description"
                    value={courseData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg h-40 outline-none focus:ring-2 focus:ring-rose-400 resize-none transition-all"
                    placeholder="Describe your course in detail..."
                />
            </div>
        </div>
    );
};

export default Step4_Details;