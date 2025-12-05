import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { toast } from 'react-hot-toast';
import { Check, ChevronRight, ChevronLeft, Save, XCircle, AlertTriangle } from 'lucide-react';

// Redux & API
import { createNewCourse } from '../../features/course/courseSlice';
import courseService from '../../features/course/courseService';
import { categoryApi } from '../../api/categoryApi';

// Hooks & Components   
import { useAddCourseForm } from '../../features/course/useAddCourseForm';
import Step1_CourseInfo from '../../components/instructor/Step1_CourseInfo';
import Step2_Media from '../../components/instructor/Step2_Media'; // Tách tương tự Step1
import Step3_Curriculum from '../../components/instructor/Step3_Curriculum';
import Step4_Details from '../../components/instructor/Step4_Details'; // Tách tương tự
import Step5_Pricing from '../../components/instructor/Step5_Pricing'; // Tách tương tự
import LessonModal from '../../components/instructor/LessonModal';
import CancelModal from '../../components/common/CancelModal';

const EditCoursePage = () => {
    const { slug } = useParams(); // Lấy slug từ URL
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector(state => state.course);

    const [currentStep, setCurrentStep] = useState(1);
    const [categoriesList, setCategoriesList] = useState([]);
    const [isFetching, setIsFetching] = useState(true); // Loading state khi fetch data edit


    // Modal State
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingSectionIndex, setEditingSectionIndex] = useState(null);
    const [editingLectureIndex, setEditingLectureIndex] = useState(null);

    // State cho Cancel Modal
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    // Use Custom Hook
    const form = useAddCourseForm();

    // Load Categories
    useEffect(() => {
        const initData = async () => {
            try {
                // A. Lấy danh sách Categories
                const catRes = await categoryApi.getAllCategories();
                const cats = catRes.data?.data || [];
                setCategoriesList(cats);

                // B. Lấy dữ liệu khóa học để Edit
                // Gọi API backend mới tạo: /api/courses/instructor/edit/:slug
                const courseRes = await courseService.getInstructorCourseForEdit(slug);
                const apiData = courseRes.data;

                // C. Map dữ liệu Categories (ID -> Object {value, label}) cho Select
                const mappedCategories = (apiData.categories || []).map(catId => {
                    // Nếu catId là object (do populate) thì lấy _id, ko thì lấy chính nó
                    const id = typeof catId === 'object' ? catId._id : catId;
                    const found = cats.find(c => c._id === id);
                    return found
                        ? { value: found._id, label: found.name, isNew: false }
                        : { value: id, label: 'Unknown', isNew: false };
                });

                // D. Đổ dữ liệu vào Form
                form.setFullData({
                    ...apiData,
                    categories: mappedCategories
                });

            } catch (error) {
                console.error(error);
                toast.error("Không thể tải dữ liệu khóa học hoặc bạn không có quyền sửa.");
                navigate('/profile/instructor/courses'); // Kick ra nếu lỗi
            } finally {
                setIsFetching(false);
            }
        };

        if (slug) {
            initData();
        }
    }, [slug, navigate]);

    // Helper: Upload Logic (Tách riêng để clean code)
    const uploadVideoHelper = async (file, title) => {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        const res = await courseService.uploadVideo(formData);
        if (res.success) return res.data.videoUrl;
        throw new Error("Upload failed");
    };


    // Helper: Upload Resource Logic
    const uploadResourceHelper = async (file, title) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        const res = await courseService.uploadResource(formData); // Gọi API upload-resource
        if (res.success) return res.data.url;
        throw new Error("Resource upload failed");
    };

    // 2. Logic Submit (Giống AddCourse nhưng gửi thêm courseId/slug để biết update)
    const handleProcessCourse = async (actionType) => {
        // actionType: 'submit' | 'draft'

        const { courseData } = form;
        const isDraft = actionType === 'draft';

        // Validation: Submit cần kỹ, Draft thì lỏng
        if (!isDraft) {
            if (!courseData.title) return toast.error("Vui lòng nhập tên khóa học");
            if (courseData.categories.length === 0) return toast.error("Vui lòng chọn danh mục");
            // Thêm các validation khác nếu cần
        } else {
            if (!courseData.title) return toast.error("Vui lòng nhập tên khóa học để lưu nháp");
        }

        let loadingId;

        loadingId = toast.loading("Đang xử lý...");

        try {
            const finalCourseData = { ...courseData };
            const processedSections = [...finalCourseData.sections];

            // 1. Upload Preview Video
            if (finalCourseData.previewVideoType === 'upload' && finalCourseData.previewVideoFile) {
                toast.loading("Uploading preview video...", { id: loadingId });
                finalCourseData.previewUrl = await uploadVideoHelper(finalCourseData.previewVideoFile, `Preview: ${finalCourseData.title}`);
            } else {
                finalCourseData.previewUrl = finalCourseData.previewVideoUrl;
            }

            // 2. Upload Lecture Videos
            for (let i = 0; i < processedSections.length; i++) {
                const section = processedSections[i];
                const processedLectures = [...section.lectures];

                for (let j = 0; j < processedLectures.length; j++) {
                    const lecture = processedLectures[j];

                    // 2A. Upload Lecture Video
                    if (lecture.videoType === 'upload' && lecture.videoFile) {
                        toast.loading(`Uploading: ${lecture.title}...`, { id: loadingId });
                        const videoUrl = await uploadVideoHelper(lecture.videoFile, lecture.title);

                        processedLectures[j] = {
                            ...lecture,
                            videoUrl: videoUrl,
                            videoFile: null
                        };
                    }

                    // 2B. Upload Resources
                    if (processedLectures[j].resources && processedLectures[j].resources.length > 0) {
                        const processedResources = [];
                        for (const res of processedLectures[j].resources) {
                            // Nếu type là file VÀ có file object (chưa upload)
                            if (res.type === 'file' && res.file) {
                                toast.loading(`Uploading Resource: ${res.title}...`, { id: loadingId });
                                try {
                                    const resUrl = await uploadResourceHelper(res.file, res.title);
                                    // Đẩy vào mảng với URL mới, bỏ file object đi
                                    processedResources.push({
                                        title: res.title,
                                        url: resUrl,
                                        type: 'file'
                                    });
                                } catch (err) {
                                    console.error("Resource upload error", err);
                                    toast.error(`Failed to upload ${res.title}`);
                                }
                            } else {
                                // Nếu là link hoặc file đã có URL (edit mode) thì giữ nguyên
                                processedResources.push(res);
                            }
                        }
                        processedLectures[j].resources = processedResources;
                    }
                }
                processedSections[i].lectures = processedLectures;
            }

            // 3. Pack FormData
            const formData = new FormData();
            formData.append('title', finalCourseData.title);
            formData.append('slug', slug); // Gửi slug gốc để backend tìm
            if (finalCourseData.courseId) {
                formData.append('courseId', finalCourseData.courseId); // Gửi courseId nếu là update course live
            }
            finalCourseData.categories.forEach(cat => formData.append('categories', cat.value));
            formData.append('level', finalCourseData.level);
            formData.append('language', finalCourseData.language);
            formData.append('price', finalCourseData.isFree ? 0 : finalCourseData.price);
            formData.append('priceDiscount', finalCourseData.isFree ? 0 : finalCourseData.priceDiscount);
            formData.append('shortDescription', finalCourseData.shortDescription);
            formData.append('description', finalCourseData.description);
            formData.append('previewUrl', finalCourseData.previewUrl);

            // Arrays
            ['learnOutcomes', 'requirements', 'audience', 'includes'].forEach(field => {
                finalCourseData[field].forEach(item => formData.append(field, item));
            });

            formData.append('sections', JSON.stringify(processedSections));

            // Status
            const statusToSend = isDraft ? 'draft' : 'pending';
            formData.append('status', statusToSend);

            // Thumbnail (chỉ gửi nếu user chọn file mới)
            if (courseData.thumbnail) {
                formData.append('thumbnail', courseData.thumbnail);
            } else {
                formData.append('thumbnailUrl', courseData.thumbnailUrl); // Gửi URL cũ nếu không đổi
            }

            // 4. Dispatch Redux Action
            const resultAction = await dispatch(createNewCourse(formData));

            if (createNewCourse.fulfilled.match(resultAction)) {
                toast.success("Cập nhật thành công!", { id: loadingId, duration: 2000 });
                navigate('/profile/instructor/courses');
            } else {
                toast.error("Lỗi Cập nhật.", { id: loadingId, duration: 3000 });
            }

        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra.", { id: loadingId, duration: 3000 });
        }
    };

    // --- Handlers cho các nút ---
    const onSaveDraft = () => handleProcessCourse('draft');
    const onSubmit = () => handleProcessCourse('submit');
    const onCancel = () => setIsCancelModalOpen(true);

    const handleModalSaveDraft = () => {
        setIsCancelModalOpen(false);
        handleProcessCourse('draft');
    };

    const handleModalExit = () => {
        setIsCancelModalOpen(false);
        navigate('/profile/instructor/courses');
    };

    // Modal Handlers
    const handleOpenLessonModal = (sIdx, lIdx) => {
        setEditingSectionIndex(sIdx);
        setEditingLectureIndex(lIdx);
        setIsLessonModalOpen(true);
    };

    const handleSaveLesson = (lessonData) => {
        if (editingLectureIndex !== null) {
            form.updateLecture(editingSectionIndex, editingLectureIndex, lessonData);
        } else {
            form.addLecture(editingSectionIndex, lessonData);
        }
        setIsLessonModalOpen(false);
    };

    // Navigation
    const nextStep = () => currentStep < 5 && setCurrentStep(c => c + 1);
    const prevStep = () => currentStep > 1 && setCurrentStep(c => c - 1);

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Step1_CourseInfo
                courseData={form.courseData}
                handleInputChange={form.handleInputChange}
                handleArrayAction={form.handleArrayAction}
                categoriesList={categoriesList}
                updateCategories={form.updateCategories}
            />;
            case 2: return <Step2_Media
                courseData={form.courseData}
                setCourseData={form.setCourseData}
                handleThumbnailUpload={form.handleThumbnailUpload}
            />;
            case 3: return <Step3_Curriculum
                sections={form.courseData.sections}
                addSection={form.addSection}
                updateSection={form.updateSection}
                removeSection={form.removeSection}
                openLessonModal={handleOpenLessonModal}
                deleteLecture={form.removeLecture}
            />;
            case 4: return <Step4_Details
                courseData={form.courseData}
                handleInputChange={form.handleInputChange}
                handleArrayAction={form.handleArrayAction}
            />;
            case 5: return <Step5_Pricing
                courseData={form.courseData}
                handleInputChange={form.handleInputChange}
            />;
            default: return null;
        }
    };

    if (isFetching) return <div className="flex h-screen justify-center items-center">Loading Course Data...</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">

                {/* Header Controls (New) */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Edit Course: {form.courseData.title}</h1>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                            <XCircle size={18} /> Cancel
                        </button>
                        <button onClick={onSaveDraft} className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                    </div>
                </div>

                {/* Progress Bar - Bạn có thể tách ra component riêng */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <ul className="flex justify-between items-center relative">
                        {["Info", "Media", "Curriculum", "Details", "Pricing"].map((label, idx) => {
                            const step = idx + 1;
                            return (
                                <li key={idx} className="flex flex-col items-center z-10 w-full">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${step === currentStep ? 'bg-blue-600 text-white shadow-lg scale-110' : step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {step < currentStep ? <Check size={20} /> : step}
                                    </div>
                                    <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
                                </li>
                            )
                        })}
                        <div className="absolute top-5 left-0 h-1 bg-gray-200 w-full -z-0"></div>
                        <div className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500 -z-0" style={{ width: `${((currentStep - 1) / 4) * 100}%` }}></div>
                    </ul>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8 min-h-[600px]">
                    {renderStepContent()}

                    <div className="flex justify-between mt-10 pt-6 border-t">
                        {currentStep > 1 ? (
                            <button onClick={prevStep} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"><ChevronLeft size={18} /> Previous</button>
                        ) : <div></div>}

                        {currentStep < 5 ? (
                            <button onClick={nextStep} className="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 flex items-center gap-2 shadow-lg">Next Step <ChevronRight size={18} /></button>
                        ) : (
                            <button onClick={onSubmit} disabled={isLoading} className="px-8 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg disabled:opacity-70">
                                {isLoading ? 'Processing...' : 'Submit Course'} <Check size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Lesson Modal */}
            {isLessonModalOpen && (
                <LessonModal
                    isOpen={isLessonModalOpen}
                    onClose={() => setIsLessonModalOpen(false)}
                    onSave={handleSaveLesson}
                    initialData={editingLectureIndex !== null ? form.courseData.sections[editingSectionIndex].lectures[editingLectureIndex] : null}
                    isEditing={editingLectureIndex !== null}
                />
            )}

            {/* Cancel Warning Modal */}
            <CancelModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onSaveDraft={handleModalSaveDraft}
                onExit={handleModalExit}
            />
        </div>
    );
};

export default EditCoursePage;