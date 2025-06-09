import React, { useState, useEffect } from 'react';
import { X, Copy, Link, Download, Check, Upload } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: any;
  onImportState?: (state: any) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareData, onImportState }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<'url' | 'json' | 'import'>('url');

  useEffect(() => {
    if (isOpen && shareData) {
      generateShareUrl();
    }
  }, [isOpen, shareData]);

  const generateShareUrl = () => {
    try {
      // Compress the state data
      const compressedData = btoa(JSON.stringify(shareData));
      const baseUrl = window.location.origin + window.location.pathname;
      const url = `${baseUrl}?share=${encodeURIComponent(compressedData)}`;
      setShareUrl(url);
    } catch (error) {
      console.error('Error generating share URL:', error);
      setShareUrl('Error generating share URL');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadConfig = () => {
    const dataStr = JSON.stringify(shareData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'linalgovistool-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedState = JSON.parse(content);
        
        if (onImportState) {
          onImportState(importedState);
          onClose();
        }
      } catch (error) {
        console.error('Error parsing imported file:', error);
        alert('Error parsing the imported file. Please ensure it\'s a valid JSON configuration.');
      }
    };
    reader.readAsText(file);
  };

  const shareToSocial = (platform: string) => {
    const text = 'Check out my linear algebra visualization created with Linalgovistool!';
    const url = shareUrl;
    
    let shareUrl_social = '';
    switch (platform) {
      case 'twitter':
        shareUrl_social = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl_social = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl_social = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'reddit':
        shareUrl_social = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl_social) {
      window.open(shareUrl_social, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <Link className="w-6 h-6 mr-3 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Share Visualization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-5rem)] overflow-y-auto">
          <div className="space-y-6">
            {/* Share Method Toggle */}
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setShareMethod('url')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === 'url'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Share Link
              </button>
              <button
                onClick={() => setShareMethod('json')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === 'json'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Export Config
              </button>
              <button
                onClick={() => setShareMethod('import')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === 'import'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Import Config
              </button>
            </div>

            {shareMethod === 'url' && (
              <div className="space-y-4">
                {/* Share URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50 text-gray-500"
                    />
                    <button
                      onClick={() => copyToClipboard(shareUrl)}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>
                  )}
                </div>

                {/* Social Sharing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Share on Social Media
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => shareToSocial('twitter')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      <span className="text-sm font-medium">Twitter</span>
                    </button>
                    <button
                      onClick={() => shareToSocial('facebook')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span className="text-sm font-medium">Facebook</span>
                    </button>
                    <button
                      onClick={() => shareToSocial('linkedin')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <span className="text-sm font-medium">LinkedIn</span>
                    </button>
                    <button
                      onClick={() => shareToSocial('reddit')}
                      className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <span className="text-sm font-medium">Reddit</span>
                    </button>
                  </div>
                </div>

                {/* URL Info */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">How it works</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Your visualization state is encoded in the URL</li>
                    <li>• Anyone with the link can view your exact configuration</li>
                    <li>• No data is stored on our servers - everything is in the URL</li>
                    <li>• Works across different devices and browsers</li>
                  </ul>
                </div>
              </div>
            )}
            
            {shareMethod === 'json' && (
              <div className="space-y-4">
                {/* Export Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration Data
                  </label>
                  <textarea
                    value={JSON.stringify(shareData, null, 2)}
                    readOnly
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Export Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(shareData, null, 2))}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </button>
                  <button
                    onClick={downloadConfig}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </button>
                </div>

                {/* JSON Info */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Configuration Export</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Save your visualization as a JSON configuration file</li>
                    <li>• Share the configuration via email or file sharing</li>
                    <li>• Import configurations in future sessions</li>
                    <li>• Perfect for educational materials and presentations</li>
                  </ul>
                </div>
              </div>
            )}
            
            {shareMethod === 'import' && (
              <div className="space-y-4">
                {/* File Import */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Configuration
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                      id="config-file-input"
                    />
                    <label
                      htmlFor="config-file-input"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to select a configuration file
                      </span>
                      <span className="text-xs text-gray-500">
                        or drag and drop a .json file here
                      </span>
                    </label>
                  </div>
                </div>

                {/* Import Info */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">Configuration Import</h4>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• Import previously exported JSON configuration files</li>
                    <li>• Restore complete visualization states and settings</li>
                    <li>• Compatible with all Linalgovistool configurations</li>
                    <li>• Perfect for loading saved educational examples</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
