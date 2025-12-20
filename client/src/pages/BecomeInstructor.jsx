import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import {
    getInstructorApplication,
    applyToBecomeInstructor,
    reset,
} from '../features/user/userSlice';

const BecomeInstructor = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        instructorApplication,
        isApplicationLoading,
        isLoading,
        isSuccess,
        isError,
        message,
    } = useSelector((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        bio: '',
        experience: '',
        sampleVideoUrl: '',
        intendedTopics: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Fetch trạng thái đơn khi load trang
    useEffect(() => {
        dispatch(getInstructorApplication());
    }, [dispatch]);

    // 2. Handle success/error messages
    useEffect(() => {
        if (isSuccess && message) {
            toast.success(message);
            setIsModalOpen(false);
            dispatch(getInstructorApplication()); // Refresh status
            dispatch(reset());
        }

        if (isError && message) {
            toast.error(message);
            dispatch(reset());
        }
    }, [isSuccess, isError, message, dispatch]);

    // 3. Pre-fill form if rejected
    useEffect(() => {
        if (instructorApplication?.status === 'rejected') {
            const app = instructorApplication;
            setFormData({
                bio: app.bio || '',
                experience: app.experience || '',
                sampleVideoUrl: app.sampleVideoUrl || '',
                intendedTopics: app.intendedTopics ? app.intendedTopics.join(', ') : ''
            });
        }
    }, [instructorApplication]);

    // 4. Xử lý Input Form
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 5. Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(applyToBecomeInstructor(formData));
    };

    // --- Helper Render UI dựa trên Status ---
    const renderActionSection = () => {
        if (isApplicationLoading) return <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>;

        // Trường hợp 1: Đang chờ duyệt
        if (instructorApplication && instructorApplication.status === 'pending') {
            return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
                    <div className="flex items-center gap-3">
                        <Clock className="text-yellow-600" />
                        <div>
                            <h4 className="font-bold text-yellow-800">Đăng ký đang chờ duyệt</h4>
                            <p className="text-sm text-yellow-700">Đơn đăng ký của bạn đang được admin kiểm duyệt. Thường mất 24-48 giờ.</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Trường hợp 2: Đã là Instructor (Approved)
        if (user.role === 'instructor' || (instructorApplication && instructorApplication.status === 'approved')) {
            return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-600" />
                        <div>
                            <h4 className="font-bold text-green-800">Xin chúc mừng!</h4>
                            <p className="text-sm text-green-700">Bạn đã trở thành giảng viên. Đi đến trang dashboard để tạo khóa học.</p>
                            <Link to="/instructor/dashboard" className="mt-2 inline-block text-sm font-bold text-green-700 underline">Go to Dashboard</Link>
                        </div>
                    </div>
                </div>
            );
        }

        // Trường hợp 3: Bị từ chối (Rejected) -> Cho phép Apply lại
        if (instructorApplication && instructorApplication.status === 'rejected') {
            return (
                <div className="space-y-4 max-w-lg">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-600 mt-1" />
                            <div>
                                <h4 className="font-bold text-red-800">Đăng ký không thành công</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    <span className="font-semibold">Reason: {instructorApplication?.rejectionReason}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
                    >
                        Update & Re-Apply
                    </button>
                </div>
            );
        }

        // Trường hợp 4: Chưa từng đăng ký (Null)
        return (
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-rose-600 text-white rounded-full font-bold text-lg hover:bg-rose-700 transition shadow-xl flex items-center gap-2"
            >
                Register Now <i className="isax isax-arrow-right-3"></i>
            </button>
        );
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* --- HTML CONTENT (Đã convert sang JSX) --- */}

            {/* Share Your Knowledge Section */}
            <div className="py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center">
                        <div className="w-full lg:w-7/12 lg:pr-12">
                            <div className="mb-8">
                                <span className="text-blue-600 font-medium underline mb-2 inline-block">Share Knowledge</span>
                                <h2 className="text-4xl font-bold text-gray-900 mb-4">Share Your Knowledge. Inspire the Future.</h2>
                                <p className="text-gray-600 text-lg leading-relaxed">Share your knowledge, inspire learners worldwide, and earn while doing what you love. Join a community of experts transforming education through engaging and accessible content.</p>
                            </div>

                            {/* Benefits Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {[ // icon
                                    { title: "Flexible Work", desc: "Teach at your own pace.", icon: "/instructor-icon1.svg" },
                                    { title: "Earning Potential", desc: "Monetize your expertise.", icon: "/instructor-icon2.svg" },
                                    { title: "Impact", desc: "Reach and educate learners.", icon: "/instructor-icon3.svg" },
                                    { title: "Support", desc: "Access to dedicated support.", icon: "/instructor-icon4.svg" }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border hover:shadow-md transition">
                                        <div className="flex items-center">
                                            <div className="mr-4 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                                                <img src={item.icon} alt="icon" />
                                            </div>
                                            <div>
                                                <h6 className="font-bold text-gray-800">{item.title}</h6>
                                                <p className="text-gray-500 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* --- ACTION BUTTON AREA --- */}
                            <div className="mt-8">
                                {renderActionSection()}
                            </div>
                        </div>

                        {/* Image Section (Giữ nguyên hoặc dùng ảnh placeholder) */}
                        <div className="hidden lg:block w-full lg:w-5/12">
                            <div className="relative">
                                <img src="/BecomeInstructor.jpg" alt="Instructor" className="w-full rounded-2xl shadow-2xl"
                                    onError={(e) => e.target.src = 'https://img.freepik.com/free-photo/medium-shot-man-wearing-headphones_23-2149302639.jpg'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works Section */}
            <div className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <span className="text-blue-600 font-medium underline mb-2 inline-block">Our Workflow</span>
                    <h2 className="text-3xl font-bold mb-2">How It Works</h2>
                    <p className="text-gray-500 mb-12">Turn Your Expertise into Impact in Just 3 Simple Steps!</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Apply & Get Approved", desc: "Submit your application and get approved to access the platform.", icon: "/how-it-works-1.svg" },
                            { title: "Create & Upload Content", desc: "Develop and upload your courses, including videos and quizzes.", icon: "/how-it-works-2.svg" },
                            { title: "Teach & Earn", desc: "Reach learners worldwide and start earning.", icon: "/how-it-works-3.svg" }
                        ].map((step, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm text-center">
                                <div className="text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    <img src={step.icon} alt="icon" />
                                </div>
                                <h5 className="font-bold text-xl mb-3">{step.title}</h5>
                                <p className="text-gray-500">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">Instructor Application</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Professional Bio <span className="text-red-500">*</span></label>
                                <textarea
                                    name="bio"
                                    required
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Tell us about yourself, your expertise, and why you want to teach..."
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Experience & Qualifications <span className="text-red-500">*</span></label>
                                <textarea
                                    name="experience"
                                    required
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="List your relevant work experience, certifications, or degrees..."
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Intended Topics</label>
                                <input
                                    type="text"
                                    name="intendedTopics"
                                    value={formData.intendedTopics}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Web Development, Digital Marketing, Graphic Design (comma separated)"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Sample Video URL (Optional)</label>
                                <input
                                    type="url"
                                    name="sampleVideoUrl"
                                    value={formData.sampleVideoUrl}
                                    onChange={handleInputChange}
                                    placeholder="Link to a YouTube video demonstrating your teaching style"
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Providing a sample video increases your chances of approval.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>Processing...</>
                                    ) : (
                                        <>Submit Application</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BecomeInstructor;