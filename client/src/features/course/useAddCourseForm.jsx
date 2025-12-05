import { useState } from 'react';

export const useAddCourseForm = () => {
    const [courseData, setCourseData] = useState({
        title: '',
        categories: [], // Mảng { value, label, isNew }
        level: 'alllevels',
        language: 'Vietnamese',
        price: 0,
        priceDiscount: 0,
        isFree: false,
        shortDescription: '',
        description: '',
        thumbnail: null,
        thumbnailPreview: '',

        previewVideoType: 'url',
        previewVideoUrl: '',
        previewVideoFile: null,

        learnOutcomes: [],
        requirements: [],
        audience: [],
        includes: [],

        sections: [],
        messageToReviewer: '',
    });

    // Xử lý input text/select/checkbox
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCourseData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Xử lý upload thumbnail
    const handleThumbnailUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCourseData(prev => ({
                ...prev,
                thumbnail: file,
                thumbnailPreview: URL.createObjectURL(file)
            }));
        }
    };

    // Xử lý mảng đơn giản (requirements, audience...)
    const handleArrayAction = (field, action, index, value) => {
        const newArray = [...courseData[field]];
        if (action === 'add') newArray.push('');
        if (action === 'remove') newArray.splice(index, 1);
        if (action === 'update') newArray[index] = value;
        setCourseData(prev => ({ ...prev, [field]: newArray }));
    };

    // Xử lý Categories
    const updateCategories = (newCategories) => {
        setCourseData(prev => ({ ...prev, categories: newCategories }));
    };

    // --- CURRICULUM ACTIONS (Section & Lecture) ---
    const addSection = () => {
        setCourseData(prev => ({
            ...prev,
            sections: [...prev.sections, { title: 'New Section', lectures: [], isEditing: true }]
        }));
    };

    const updateSection = (index, newSectionData) => {
        const newSections = [...courseData.sections];
        newSections[index] = { ...newSections[index], ...newSectionData };
        setCourseData(prev => ({ ...prev, sections: newSections }));
    };

    const removeSection = (index) => {
        const newSections = [...courseData.sections];
        newSections.splice(index, 1);
        setCourseData(prev => ({ ...prev, sections: newSections }));
    };

    const addLecture = (sectionIndex, lectureData) => {
        const newSections = [...courseData.sections];
        newSections[sectionIndex].lectures.push(lectureData);
        setCourseData(prev => ({ ...prev, sections: newSections }));
    };

    const updateLecture = (sectionIndex, lectureIndex, lectureData) => {
        const newSections = [...courseData.sections];
        newSections[sectionIndex].lectures[lectureIndex] = lectureData;
        setCourseData(prev => ({ ...prev, sections: newSections }));
    };

    const removeLecture = (sectionIndex, lectureIndex) => {
        const newSections = [...courseData.sections];
        newSections[sectionIndex].lectures.splice(lectureIndex, 1);
        setCourseData(prev => ({ ...prev, sections: newSections }));
    };

    return {
        courseData,
        setCourseData,
        handleInputChange,
        handleThumbnailUpload,
        handleArrayAction,
        updateCategories,
        addSection,
        updateSection,
        removeSection,
        addLecture,
        updateLecture,
        removeLecture
    };
};