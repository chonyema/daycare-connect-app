'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';

interface DocumentUploadProps {
  onDocumentSelect: (documentData: { name: string; data: string; type: string }) => void;
  onClose: () => void;
  acceptedTypes?: string[];
  title?: string;
  description?: string;
}

export default function DocumentUpload({
  onDocumentSelect,
  onClose,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  title = "Upload Document",
  description = "Upload important documents related to your booking"
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onDocumentSelect({
        name: file.name,
        data: result,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (extension === 'pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              Supported: Images, PDF, Word documents
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* File Type Examples */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <Image className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Photos</p>
            </div>
            <div className="text-center">
              <FileText className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-gray-600">PDF</p>
            </div>
            <div className="text-center">
              <File className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}