import { 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileSpreadsheet, 
  Presentation, 
  File, 
  FileArchive 
} from "lucide-react";

interface FileIconProps {
  fileName: string;
  mimeType?: string;
  className?: string;
}

export function FileIcon({ fileName, mimeType, className = "w-5 h-5" }: FileIconProps) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // PDF files
  if (extension === 'pdf' || mimeType?.includes('pdf')) {
    return <FileText className={`${className} text-red-400`} />;
  }
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tif'].includes(extension || '') || 
      mimeType?.startsWith('image/')) {
    return <FileImage className={`${className} text-green-400`} />;
  }
  
  // Video files
  if (['mp4', 'mov', 'avi', 'webm', '3gp', 'flv', 'wmv'].includes(extension || '') || 
      mimeType?.startsWith('video/')) {
    return <FileVideo className={`${className} text-blue-400`} />;
  }
  
  // Audio files
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension || '') || 
      mimeType?.startsWith('audio/')) {
    return <FileAudio className={`${className} text-purple-400`} />;
  }
  
  // Spreadsheet files
  if (['xls', 'xlsx', 'csv', 'ods', 'xlsb', 'xlsm', 'xltx'].includes(extension || '') || 
      mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return <FileSpreadsheet className={`${className} text-emerald-400`} />;
  }
  
  // Presentation files
  if (['ppt', 'pptx', 'ppsx'].includes(extension || '') || 
      mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return <Presentation className={`${className} text-orange-400`} />;
  }
  
  // Document files
  if (['doc', 'docx', 'rtf', 'odt'].includes(extension || '') || 
      mimeType?.includes('document') || mimeType?.includes('word')) {
    return <FileText className={`${className} text-blue-500`} />;
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '') || 
      mimeType?.includes('zip') || mimeType?.includes('archive')) {
    return <FileArchive className={`${className} text-yellow-400`} />;
  }
  
  // Text files
  if (['txt', 'md', 'xml', 'json'].includes(extension || '') || 
      mimeType?.startsWith('text/')) {
    return <FileText className={`${className} text-gray-400`} />;
  }
  
  // Default file icon
  return <File className={`${className} text-gray-400`} />;
}