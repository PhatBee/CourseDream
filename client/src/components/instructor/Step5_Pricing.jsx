import React from 'react';

const Step5_Pricing = ({ courseData, handleInputChange }) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Pricing & Settings</h2>

            {/* Status Selection (Mới) */}
            <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Course Status (Initial)</label>
                <select
                    name="status"
                    value={courseData.status || 'draft'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                    <option value="draft">Draft (Only you can see)</option>
                    <option value="hidden">Hidden (Accessible via direct link only)</option>
                    {/* Không cho chọn 'published' hay 'pending' trực tiếp ở đây, nút Submit sẽ set 'pending' */}
                </select>
                <p className="text-xs text-gray-500 mt-1">Draft courses are not visible to students. You can publish it later after review.</p>
            </div>

            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                    type="checkbox"
                    id="isFree"
                    name="isFree"
                    checked={courseData.isFree}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isFree" className="font-medium text-gray-700 cursor-pointer select-none">
                    This is a free course
                </label>
            </div>

            {!courseData.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                    <div>
                        <label className="block text-sm font-bold mb-2">Regular Price (VND)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="price"
                                value={courseData.price}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Discounted Price (VND)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="priceDiscount"
                                value={courseData.priceDiscount}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Must be lower than or equal to regular price.</p>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold mb-2">Message to Reviewer</label>
                <textarea
                    name="messageToReviewer"
                    value={courseData.messageToReviewer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg h-32 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any notes for the admin reviewer..."
                ></textarea>
            </div>
        </div>
    );
};

export default Step5_Pricing;