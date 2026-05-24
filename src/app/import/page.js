'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaUpload,
  FaFileAlt,
  FaCheck,
  FaEdit,
  FaTimes,
  FaSpinner,
  FaDownload,
  FaEye,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useImport } from '../hooks/useImport';
import { useTenants } from '../hooks/useTenants';
import SelectField from '../components/inputs/SelectField';
import ImportPreviewModal from '../components/ImportPreviewModal';
import ImportEditModal from '../components/ImportEditModal';
import { useContextAuth } from '../context/authContext';

const ImportPage = () => {
  const router = useRouter();
  const { isAdmin, isLoaded } = useContextAuth();
  
  // Redirect non-admins
  useEffect(() => {
    if (isLoaded && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
    }
  }, [isAdmin, isLoaded, router]);
  const fileInputRef = useRef(null);
  
  // Initialize selectedTenants inside useEffect to prevent dependency array issues
  const [localSelectedTenants, setLocalSelectedTenants] = useState([]);
  
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const {
    previewData,
    setPreviewData,
    parseTSV,
    isParsing,
    executeImport,
    isExecuting,
    executeResult,
  } = useImport();

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload'); // upload, preview, edit, importing, complete
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingType, setEditingType] = useState(null); // 'organizations' or 'resources'

  // Set default tenant when tenants load
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenant) {
      // Try to use the first selected tenant or fall back to first available
      const defaultTenant = localSelectedTenants?.[0] 
        ? tenants.find(t => t.id === localSelectedTenants[0])
        : tenants[0];
      setSelectedTenant(defaultTenant);
    }
  }, [tenants, localSelectedTenants, selectedTenant]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.tsv') || file.type === 'text/tab-separated-values') {
        setSelectedFile(file);
        handleFileParse(file);
      } else {
        toast.error('Please select a TSV file');
      }
    }
  };

  // Parse the selected file
  const handleFileParse = async (file) => {
    if (!selectedTenant) {
      toast.error('Please select a tenant first');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      parseTSV({ 
        file: new Blob([content], { type: 'text/tab-separated-values' }), 
        tenantId: selectedTenant.id 
      });
      setCurrentStep('preview');
      setShowPreviewModal(true);
    };
    reader.readAsText(file);
  };

  // Handle import execution
  const handleExecuteImport = async () => {
    if (!previewData || !selectedTenant) {
      toast.error('Missing data or tenant selection');
      return;
    }

    setCurrentStep('importing');
    executeImport({ importData: previewData, tenantId: selectedTenant.id });
  };

  // Download sample TSV
  const downloadSampleTSV = () => {
    const sampleContent = `Business Unit\tService\tLink\tEmail\tPhone number\tDemographics\tAccessibility\tDescription
Sample Business Unit\tEducation, Support\thttps://example.org\tinfo@example.org\t555-1234\tAll Patients\tNational\tSample description of services
Another Business Unit\tFinancial Assistance\thttps://another.org\tcontact@another.org\tN/A\tPediatric Patients\tVirtual\tProvides financial support for families`;

    const blob = new Blob([sampleContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_template.tsv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle edit modal
  const handleEdit = (type) => {
    setEditingType(type);
    setShowEditModal(true);
  };

  // Update preview data after edit
  const handleUpdateData = (updatedData) => {
    setPreviewData(updatedData);
    setShowEditModal(false);
    toast.success('Data updated successfully');
  };

  // Navigate after successful import
  React.useEffect(() => {
    if (executeResult?.success) {
      setCurrentStep('complete');
      setTimeout(() => {
        router.push('/business-units');
      }, 3000);
    }
  }, [executeResult, router]);

  // Don't render the page if not admin
  if (!isLoaded || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Import Business Units & Resources
          </h1>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'upload' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <FaUpload />
              </div>
              <span className="ml-2">Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
            <div className={`flex items-center ${currentStep === 'preview' || currentStep === 'edit' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'preview' || currentStep === 'edit' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <FaEye />
              </div>
              <span className="ml-2">Preview & Edit</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
            <div className={`flex items-center ${currentStep === 'importing' || currentStep === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full p-2 ${currentStep === 'importing' || currentStep === 'complete' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {currentStep === 'complete' ? <FaCheck /> : <FaSpinner className="animate-spin" />}
              </div>
              <span className="ml-2">Import</span>
            </div>
          </div>

          {/* Tenant selector */}
          <div className="mb-6">
            {tenantsLoading ? (
              <div className="flex items-center justify-center py-4">
                <FaSpinner className="animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading tenants...</span>
              </div>
            ) : (
              <SelectField
                label="Select Tenant"
                options={tenants || []}
                value={selectedTenant}
                onChange={setSelectedTenant}
                placeholder="Select a tenant..."
              />
            )}
          </div>

          {/* File upload area */}
          {currentStep === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FaFileAlt className="mx-auto text-4xl text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload TSV File
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Select a TSV file containing business units and resources data
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".tsv,text/tab-separated-values"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedTenant || isParsing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isParsing ? (
                    <>
                      <FaSpinner className="inline-block mr-2 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <FaUpload className="inline-block mr-2" />
                      Choose File
                    </>
                  )}
                </button>
                
                <button
                  onClick={downloadSampleTSV}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <FaDownload className="inline-block mr-2" />
                  Download Template
                </button>
              </div>

              {selectedFile && (
                <p className="mt-4 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          )}

          {/* Preview summary */}
          {currentStep === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Import Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Business Units:</span>
                    <span className="ml-2 font-semibold">{previewData.organizations?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Resources:</span>
                    <span className="ml-2 font-semibold">{previewData.resources?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Tags:</span>
                    <span className="ml-2 font-semibold">{previewData.tags?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleEdit('organizations')}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <FaEdit className="inline-block mr-2" />
                  Edit Business Units
                </button>
                <button
                  onClick={() => handleEdit('resources')}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <FaEdit className="inline-block mr-2" />
                  Edit Resources
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isExecuting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isExecuting ? (
                    <>
                      <FaSpinner className="inline-block mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="inline-block mr-2" />
                      Execute Import
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Import complete */}
          {currentStep === 'complete' && executeResult && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FaCheck className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Import Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Successfully imported {executeResult.summary?.organizationsCreated || 0} business units
                and {executeResult.summary?.resourcesCreated || 0} resources.
              </p>
              {executeResult.summary?.errors > 0 && (
                <p className="text-yellow-600">
                  {executeResult.summary.errors} items had errors and were skipped.
                </p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Redirecting to business units page...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <ImportPreviewModal
          data={previewData}
          onClose={() => setShowPreviewModal(false)}
          onEdit={handleEdit}
          onConfirm={handleExecuteImport}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && previewData && (
        <ImportEditModal
          data={previewData}
          editingType={editingType}
          onSave={handleUpdateData}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default ImportPage;
