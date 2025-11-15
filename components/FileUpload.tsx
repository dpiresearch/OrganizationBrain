
import React, { useState, useCallback } from 'react';
import { UploadCloud } from './icons';

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  const dragClass = isDragging ? 'border-indigo-400 bg-gray-700' : 'border-gray-600';

  return (
    <div>
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center w-full h-32 px-4 transition bg-gray-900 border-2 ${dragClass} border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none`}>
        <span className="flex items-center space-x-2">
          <UploadCloud className="w-6 h-6 text-gray-400"/>
          <span className="font-medium text-gray-400">
            Drop files to attach, or{' '}
            <span className="text-indigo-400 underline">browse</span>
          </span>
        </span>
        <input type="file" name="file_upload" className="hidden" multiple onChange={handleChange} />
      </label>
    </div>
  );
};
