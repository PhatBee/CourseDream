import { useState, useCallback, useRef } from 'react';

// ======================== SLUG HELPER ========================
// Clone logic backend: slugify + timestamp để unique
const toSlug = (text) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
        .replace(/[đ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

export const useAddCourseForm = () => {
    // ✨ Timestamp cố định cho session này - dùng để tạo slug unique mà không thay đổi khi user gõ
    const slugTimestampRef = useRef(Date.now());

    const [courseData, setCourseData] = useState({
        title: '',
        slug: '',
        categories: [], // Mảng { value, label, isNew }
        level: 'alllevels',
        language: 'Vietnamese',
        price: 0,
        priceDiscount: 0,
        durationInWeeks: 0,
        isFree: false,
        shortDescription: '',
        description: '',
        thumbnail: null,
        thumbnailUrl: '',
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

    const setFullData = (apiData) => {
        // apiData là data trả về từ service getCourseForEdit
        setCourseData({
            title: apiData.title || '',
            slug: apiData.slug || '',
            courseId: apiData.courseId || null, // Lưu lại ID gốc nếu có

            // Map Categories: Backend trả về mảng ID, ta cần convert về format select nếu cần
            // Lưu ý: Ở EditPage ta sẽ xử lý mapping label sau khi fetch category list
            categories: apiData.categories || [],

            level: apiData.level || 'alllevels',
            language: apiData.language || 'Vietnamese',
            price: apiData.price || 0,
            priceDiscount: apiData.priceDiscount || 0,
            durationInWeeks: apiData.durationInWeeks || 0,
            isFree: (apiData.price === 0),
            shortDescription: apiData.shortDescription || '',
            description: apiData.description || '',

            thumbnail: null, // File upload set null
            thumbnailUrl: apiData.thumbnail || '', // URL ảnh cũ
            thumbnailPreview: apiData.thumbnail || '',

            previewVideoType: 'url',
            previewVideoUrl: apiData.previewUrl || '',
            previewVideoFile: null,

            learnOutcomes: apiData.learnOutcomes || [],
            requirements: apiData.requirements || [],
            audience: apiData.audience || [],
            includes: apiData.includes || [],

            sections: apiData.sections || [],
            messageToReviewer: '',
            status: apiData.status || 'draft'
        });
    };

    // Xử lý input text/select/checkbox
    // Tự sinh slug khi title thay đổi và slug chưa được khóa
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCourseData(prev => {
            const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };

            // Auto-generate slug khi title thay đổi và slug chưa bị lock
            // slugTimestampRef.current là hằng số trong suốt session này
            if (name === 'title' && !prev.slugLocked) {
                updated.slug = value ? `${toSlug(value)}-${slugTimestampRef.current}` : '';
            }

            return updated;
        });
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

    // --- SLUG MANAGEMENT ---
    /**
     * Đảm bảo khoa học luôn có slug trước khi upload S3.
     * Gọi khi instructor chuyển sang Step 2 hoặc bắt đầu add lesson.
     * Trả về slug (để dùng ngay mà không cần re-render)
     */
    const ensureSlug = useCallback((currentData) => {
        const data = currentData || courseData;
        if (data.slug) return data.slug; // Đã có slug

        // Dùng timestamp cố định từ ref
        const ts = slugTimestampRef.current;
        const newSlug = data.title
            ? `${toSlug(data.title)}-${ts}`
            : `course-${ts}`;

        setCourseData(prev => ({
            ...prev,
            slug: newSlug,
            slugLocked: true,   // Khóa slug sau khi đã tạo
        }));

        return newSlug;
    }, [courseData]);

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
        removeLecture,
        setFullData,
        ensureSlug,   // ✨ Đảm bảo slug tồn tại trước khi upload S3
    };
};
