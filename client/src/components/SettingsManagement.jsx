import React, { useState, useEffect } from 'react';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Building,
  Users,
  BookOpen,
  MapPin,
  Briefcase,
  Award,
  Tag
} from 'lucide-react';

const SettingsManagement = () => {
  const [activeCategory, setActiveCategory] = useState('rooms');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = [
    { id: 'rooms', label: 'Rooms', icon: Building, description: 'Manage room numbers and names' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, description: 'Manage course subjects' },
    { id: 'faculties', label: 'Faculties', icon: Users, description: 'Manage faculty names' },
    { id: 'departments', label: 'Departments', icon: Briefcase, description: 'Manage departments' },
    { id: 'positions', label: 'Positions', icon: Award, description: 'Manage job positions' },
    { id: 'locations', label: 'Locations', icon: MapPin, description: 'Manage building locations' },
    { id: 'amenities', label: 'Amenities', icon: Tag, description: 'Manage room amenities' },
    { id: 'companies', label: 'Companies', icon: Building, description: 'Manage visitor companies' },
    { id: 'purposes', label: 'Visit Purposes', icon: Tag, description: 'Manage visit purposes' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.settings.getAll();
      setSettings(response.data || {});
    } catch (error) {
      console.error('Error loading settings:', error);
      handleApiError(error);
      // Initialize with default values if API fails
      setSettings({
        rooms: ['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Conference Hall'],
        subjects: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry'],
        faculties: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
        departments: ['Computer Science', 'IT', 'Electronics', 'HR', 'Finance'],
        positions: ['Professor', 'Manager', 'Developer', 'Analyst'],
        locations: ['Floor 1', 'Floor 2', 'Floor 3', 'Ground Floor'],
        amenities: ['Projector', 'Whiteboard', 'TV Screen', 'WiFi'],
        companies: ['ABC Corporation', 'XYZ Technologies', 'Other'],
        purposes: ['Business Meeting', 'Interview', 'Consultation', 'Training']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newItem.trim()) return;

    try {
      const updatedList = [...(settings[activeCategory] || []), newItem.trim()];
      await apiService.settings.update(activeCategory, updatedList);
      
      setSettings(prev => ({
        ...prev,
        [activeCategory]: updatedList
      }));
      
      setNewItem('');
      setShowAddForm(false);
      
      if (window.showSuccess) {
        window.showSuccess('Item added successfully!');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleEdit = async (index, newValue) => {
    if (!newValue.trim()) return;

    try {
      const updatedList = [...(settings[activeCategory] || [])];
      updatedList[index] = newValue.trim();
      
      await apiService.settings.update(activeCategory, updatedList);
      
      setSettings(prev => ({
        ...prev,
        [activeCategory]: updatedList
      }));
      
      setEditingItem(null);
      
      if (window.showSuccess) {
        window.showSuccess('Item updated successfully!');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const updatedList = (settings[activeCategory] || []).filter((_, i) => i !== index);
      
      await apiService.settings.update(activeCategory, updatedList);
      
      setSettings(prev => ({
        ...prev,
        [activeCategory]: updatedList
      }));
      
      if (window.showSuccess) {
        window.showSuccess('Item deleted successfully!');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const currentCategory = categories.find(cat => cat.id === activeCategory);
  const currentItems = settings[activeCategory] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings Management</h1>
            <p className="text-gray-600">Manage dropdown options and system settings</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setShowAddForm(false);
                      setEditingItem(null);
                      setNewItem('');
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md">
            {/* Category Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    {React.createElement(currentCategory.icon, { className: "h-6 w-6 text-blue-600" })}
                    <span>{currentCategory.label}</span>
                  </h2>
                  <p className="text-gray-600 mt-1">{currentCategory.description}</p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{showAddForm ? 'Cancel' : 'Add New'}</span>
                </button>
              </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="p-6 bg-blue-50 border-b">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={`Enter new ${currentCategory.label.toLowerCase().slice(0, -1)}...`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    autoFocus
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newItem.trim()}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="p-6">
              {currentItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    {React.createElement(currentCategory.icon, { className: "h-16 w-16 mx-auto" })}
                  </div>
                  <p className="text-gray-600">No items found. Add your first item above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {editingItem === index ? (
                        <div className="flex-1 flex space-x-3">
                          <input
                            type="text"
                            defaultValue={item}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEdit(index, e.target.value);
                              }
                            }}
                            onBlur={(e) => handleEdit(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-900 font-medium">{item}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingItem(index)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
              <p className="text-sm text-gray-600">
                Total items: <span className="font-semibold text-gray-900">{currentItems.length}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default SettingsManagement;
