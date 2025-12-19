import React from 'react';
import { Link as LinkIcon, Upload } from 'lucide-react';

const VideoInputSelector = ({ type, urlValue, onTypeChange, onUrlChange, onFileChange }) => (
    <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex gap-4 mb-4 border-b pb-2">
            <button
                type="button"
                onClick={() => onTypeChange('url')}
                className={`flex items-center gap-2 pb-2 px-2 transition-colors ${type === 'url' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <LinkIcon size={18} /> URL / YouTube
            </button>
            <button
                type="button"
                onClick={() => onTypeChange('upload')}
                className={`flex items-center gap-2 pb-2 px-2 transition-colors ${type === 'upload' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Upload size={18} /> Upload Video
            </button>
        </div>

        {type === 'url' ? (
            <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    value={urlValue || ''}
                    onChange={(e) => onUrlChange(e.target.value)}
                />
            </div>
        ) : (
            <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Video File (.mp4, .mov, .mkv)</label>
                <input
                    type="file"
                    accept="video/*"
                    className="w-full px-3 py-2 border rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={onFileChange}
                />
                <p className="text-xs text-gray-500 mt-1">Max size: 100MB</p>
            </div>
        )}
    </div>
);

export default VideoInputSelector;