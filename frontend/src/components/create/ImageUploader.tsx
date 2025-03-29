import React, { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  previewUrl: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  previewUrl,
  fileInputRef,
  handleFileChange,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-200 mb-1">
      Upload Image
    </label>
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-purple-500/40 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-900/40 transition-colors"
    >
      {previewUrl ? (
        <div className="space-y-3 md:space-y-4 w-full">
          <div className="mx-auto max-w-xs overflow-hidden rounded-lg border border-purple-500/40">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-auto object-contain"
            />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className="mx-auto border-purple-500 text-purple-300 hover:bg-purple-900/30"
          >
            Change Image
          </Button>
        </div>
      ) : (
        <>
          <Upload className="h-10 w-10 md:h-12 md:w-12 text-purple-400 mb-2" />
          <p className="text-sm text-gray-300 text-center">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-400 mt-1 text-center">PNG, JPG, GIF up to 10MB</p>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        required
      />
    </div>
  </div>
); 