import React, { useState, useEffect } from 'react';
import { slotApiClient } from '../utils/apiClient';
import { Calendar, GamepadIcon, Clock, Trash2, CheckCircle } from 'lucide-react';

interface GameConfig {
  gameId: string;
  displayName: string;
  gameType: string;
  theme: any;
  created_at: string;
  updated_at: string;
}

interface SavedConfigsSectionProps {
  onConfigSelect?: (config: GameConfig) => void;
}

const SavedConfigsSection: React.FC<SavedConfigsSectionProps> = ({ onConfigSelect }) => {
  const [configs, setConfigs] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; gameId: string | null }>({ show: false, gameId: null });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const result = await slotApiClient.fetchGameConfigs(1, 50);
      setConfigs(result.configs);
      setMetadata(result.metadata);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') {
      return 'Not set';
    }
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeleteClick = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setDeleteModal({ show: true, gameId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.gameId) return;
    
    const deletedGameId = deleteModal.gameId;
    setDeleting(true);
    try {
      await fetch(`https://rgs-config.onrender.com/configs/${deleteModal.gameId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      setConfigs(configs.filter(c => c.gameId !== deleteModal.gameId));
      setDeleteModal({ show: false, gameId: null });
      setToast({ show: true, message: `${deletedGameId} deleted successfully` });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    } catch (error) {
      console.error('Error deleting config:', error);
      alert('Failed to delete configuration');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, gameId: null });
  };

  const getGameTypeDisplay = (gameType: string) => {
    if (!gameType) return 'Not set';
    return gameType.charAt(0).toUpperCase() + gameType.slice(1).replace('-', ' ');
  };

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Saved Configurations</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading configurations...</span>
        </div>
      </section>
    );
  }

  if (configs.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Saved Configurations</h2>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <GamepadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No saved configurations found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Saved Configurations</h2>
        {metadata && (
          <span className="text-sm text-gray-500">
            {metadata.totalRecords} configuration{metadata.totalRecords !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <div
            key={config.gameId}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onConfigSelect?.(config)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 truncate flex-1">
                {config.gameId}
              </h3>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <GamepadIcon className="h-5 w-5 text-gray-400" />
                <button
                  onClick={(e) => handleDeleteClick(e, config.gameId)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete configuration"
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="font-medium w-20">Type:</span>
                <span>{getGameTypeDisplay(config.gameType)}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="font-medium w-16">Created:</span>
                <span>{formatDate(config.created_at)}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-medium w-16">Updated:</span>
                <span>{formatDate(config.updated_at)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-md transition-colors">
                Load Configuration
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Configuration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteModal.gameId}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SavedConfigsSection;