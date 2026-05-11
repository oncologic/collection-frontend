import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';
import {
  parseTSVFile,
  previewImportData,
  updateImportData,
  executeImport,
} from '../api/importApi';

export const useImport = () => {
  const [importData, setImportData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const { getToken } = useAuth();

  // Parse TSV file mutation
  const parseTSVMutation = useMutation({
    mutationFn: async ({ file, tenantId }) => {
      const token = await getToken();
      return parseTSVFile(file, tenantId, token);
    },
    onSuccess: (data) => {
      setPreviewData(data.data);
      toast.success('File parsed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to parse TSV file');
    },
  });

  // Preview import mutation
  const previewMutation = useMutation({
    mutationFn: async ({ tsvContent, tenantId }) => {
      const token = await getToken();
      return previewImportData(tsvContent, tenantId, token);
    },
    onSuccess: (data) => {
      setPreviewData(data.data);
      toast.success('Preview generated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate preview');
    },
  });

  // Update import data mutation
  const updateMutation = useMutation({
    mutationFn: async (importData) => {
      const token = await getToken();
      return updateImportData(importData, token);
    },
    onSuccess: (data) => {
      setImportData(data.data);
      toast.success('Data updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update data');
    },
  });

  // Execute import mutation
  const executeMutation = useMutation({
    mutationFn: async ({ importData, tenantId }) => {
      const token = await getToken();
      return executeImport(importData, tenantId, token);
    },
    onSuccess: (data) => {
      const { summary } = data;
      let message = 'Import completed:\n';
      
      if (summary.organizationsCreated > 0) {
        message += `✓ ${summary.organizationsCreated} new organization${summary.organizationsCreated !== 1 ? 's' : ''} created\n`;
      }
      if (summary.organizationsSkipped > 0) {
        message += `↻ ${summary.organizationsSkipped} organization${summary.organizationsSkipped !== 1 ? 's' : ''} already existed (skipped)\n`;
      }
      if (summary.resourcesCreated > 0) {
        message += `✓ ${summary.resourcesCreated} new resource${summary.resourcesCreated !== 1 ? 's' : ''} created\n`;
      }
      if (summary.resourcesSkipped > 0) {
        message += `↻ ${summary.resourcesSkipped} resource${summary.resourcesSkipped !== 1 ? 's' : ''} already existed (updated tags)\n`;
      }
      if (summary.errors > 0) {
        message += `⚠ ${summary.errors} error${summary.errors !== 1 ? 's' : ''} occurred`;
      }
      
      toast.success(message, {
        duration: 6000,
        style: {
          whiteSpace: 'pre-line',
        },
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to execute import');
    },
  });

  return {
    importData,
    previewData,
    setImportData,
    setPreviewData,
    parseTSV: parseTSVMutation.mutate,
    isParsing: parseTSVMutation.isPending,
    preview: previewMutation.mutate,
    isPreviewing: previewMutation.isPending,
    updateData: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    executeImport: executeMutation.mutate,
    isExecuting: executeMutation.isPending,
    executeResult: executeMutation.data,
  };
};