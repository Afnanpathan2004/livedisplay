import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Laptop,
  Smartphone,
  Car,
  Wrench
} from 'lucide-react';

const AssetManagement = () => {
  const { token, user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await apiService.assets.getAll({
        category: filterCategory,
        status: filterStatus,
        search: searchTerm
      });
      setAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'disposed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'assigned':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case 'disposed':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'laptop':
        return <Laptop className="h-6 w-6" />;
      case 'desktop':
        return <Monitor className="h-6 w-6" />;
      case 'phone':
        return <Smartphone className="h-6 w-6" />;
      case 'vehicle':
        return <Car className="h-6 w-6" />;
      default:
        return <Package className="h-6 w-6" />;
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || asset.category === filterCategory;
    const matchesStatus = !filterStatus || asset.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const AssetCard = ({ asset }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {getCategoryIcon(asset.category)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
            <p className="text-sm text-gray-600">{asset.brand} {asset.model}</p>
            <p className="text-sm text-blue-600 font-mono">{asset.assetTag}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(asset.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
            {asset.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Category:</span> {asset.category}
        </div>
        <div>
          <span className="font-medium">Serial:</span> {asset.serialNumber}
        </div>
        <div>
          <span className="font-medium">Condition:</span> 
          <span className={`ml-1 font-medium ${getConditionColor(asset.condition)}`}>
            {asset.condition}
          </span>
        </div>
        <div>
          <span className="font-medium">Value:</span> ₹{asset.purchasePrice?.toLocaleString() || 'N/A'}
        </div>
        {asset.assignedEmployee && (
          <div className="col-span-2">
            <span className="font-medium">Assigned to:</span> {asset.assignedEmployee.name}
          </div>
        )}
        {asset.location && (
          <div className="col-span-2">
            <span className="font-medium">Location:</span> 
            {asset.location.building} - {asset.location.floor} - {asset.location.room}
          </div>
        )}
      </div>

      {asset.warrantyExpiry && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              Warranty expires: {new Date(asset.warrantyExpiry).toLocaleDateString()}
            </span>
            {new Date(asset.warrantyExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Added: {new Date(asset.createdAt).toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedAsset(asset)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg">
            <Edit className="h-4 w-4" />
          </button>
          {asset.status === 'available' && (
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Assign
            </button>
          )}
          {asset.status === 'assigned' && (
            <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
              Return
            </button>
          )}
          {asset.status === 'available' && (
            <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
              Maintenance
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const AssetModal = ({ asset, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Asset Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              {getCategoryIcon(asset.category)}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{asset.name}</h3>
              <p className="text-gray-600">{asset.brand} {asset.model}</p>
              <p className="text-blue-600 font-mono">{asset.assetTag}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Asset Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Category:</span> {asset.category}</div>
                <div><span className="font-medium">Brand:</span> {asset.brand}</div>
                <div><span className="font-medium">Model:</span> {asset.model}</div>
                <div><span className="font-medium">Serial Number:</span> {asset.serialNumber}</div>
                <div><span className="font-medium">Purchase Price:</span> ₹{asset.purchasePrice?.toLocaleString() || 'N/A'}</div>
                <div><span className="font-medium">Purchase Date:</span> {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                <div><span className="font-medium">Condition:</span> 
                  <span className={`ml-1 font-medium ${getConditionColor(asset.condition)}`}>
                    {asset.condition}
                  </span>
                </div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Assignment & Location</h4>
              <div className="space-y-2 text-sm">
                {asset.assignedEmployee ? (
                  <>
                    <div><span className="font-medium">Assigned to:</span> {asset.assignedEmployee.name}</div>
                    <div><span className="font-medium">Employee ID:</span> {asset.assignedEmployee.employeeId}</div>
                    <div><span className="font-medium">Department:</span> {asset.assignedEmployee.department}</div>
                  </>
                ) : (
                  <div><span className="font-medium">Assignment:</span> Not assigned</div>
                )}
                
                {asset.location && (
                  <>
                    <div><span className="font-medium">Building:</span> {asset.location.building}</div>
                    <div><span className="font-medium">Floor:</span> {asset.location.floor}</div>
                    <div><span className="font-medium">Room:</span> {asset.location.room}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Warranty & Maintenance</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Warranty Expiry:</span> {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}</div>
                <div><span className="font-medium">Last Maintenance:</span> {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'N/A'}</div>
                <div><span className="font-medium">Next Maintenance:</span> {asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Additional Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Created:</span> {new Date(asset.createdAt).toLocaleDateString()}</div>
                <div><span className="font-medium">Last Updated:</span> {new Date(asset.updatedAt).toLocaleDateString()}</div>
                {asset.notes && (
                  <div><span className="font-medium">Notes:</span> {asset.notes}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Asset
          </button>
          {asset.status === 'available' && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Assign Asset
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
            <p className="text-gray-600">Track and manage company assets</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="monitor">Monitor</option>
                <option value="phone">Phone</option>
                <option value="furniture">Furniture</option>
                <option value="vehicle">Vehicle</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="disposed">Disposed</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assets.filter(asset => asset.status === 'available').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assets.filter(asset => asset.status === 'assigned').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assets.filter(asset => asset.status === 'maintenance').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Asset Details Modal */}
        {selectedAsset && (
          <AssetModal 
            asset={selectedAsset} 
            onClose={() => setSelectedAsset(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export default AssetManagement;
