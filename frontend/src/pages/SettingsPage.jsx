import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { Copy, ChevronUp, ChevronDown, Eye, EyeOff, Trash2 } from 'lucide-react';
import ApiKeyGeneratedModal from '../components/ApiKeyGeneratedModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './SettingsPage.css';

const SettingsPage = () => {
    const location = useLocation();
    const { user, refreshUser, handleLogout } = useAuth();
    const { selectedProject, apiClient } = useProjects();
    const initialTab = location.state?.initialTab || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [openAccordion, setOpenAccordion] = useState('using-key');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const tabsRef = useRef({});
    const [apiKeys, setApiKeys] = useState([]);
    const [visibleKeys, setVisibleKeys] = useState({});
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isDeleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState(null);
    const [error, setError] = useState('');

    // Profile State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const fetchApiKeys = async () => {
        setError(null);
        try {
            if (apiClient) {
                const response = await apiClient.get('/api-keys/');
                setApiKeys(response.data);
            }
        } catch (error) {
            setError('Failed to fetch API keys.');
            setApiKeys([]); // Also ensure it's an array on error
            console.error(error);
        }
    };
    
    const handleGenerateKey = async () => {
        if (!apiClient) return;
        try {
            const newKeyData = await apiClient.post('/api-keys/');
            setNewlyGeneratedKey(newKeyData.key);
            setModalOpen(true);
            setError('');
            fetchApiKeys();
        } catch (err) {
            setError('Failed to generate API key. Please try again.');
            console.error(err);
        }
    };

    const handleDeleteClick = (keyId) => {
        setKeyToDelete(keyId);
        setConfirmModalOpen(true);
    };

    const handleDeleteKey = async () => {
        if (!keyToDelete) return;

        try {
            await apiClient.delete(`/api-keys/${keyToDelete}`);
            setApiKeys(prevKeys => prevKeys.filter(key => key.id !== keyToDelete));
            setError('');
        } catch (err) {
            setError('Failed to delete API key. Please try again.');
            console.error(err);
        } finally {
            setConfirmModalOpen(false);
            setKeyToDelete(null);
        }
    };

    const toggleKeyVisibility = (keyId) => {
        setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'api-key' && apiClient && selectedProject) {
            fetchApiKeys();
        }
    }, [activeTab, apiClient, selectedProject]);

    useEffect(() => {
        const activeTabNode = tabsRef.current[activeTab];
        if (activeTabNode) {
            setIndicatorStyle({
                left: activeTabNode.offsetLeft,
                width: activeTabNode.offsetWidth,
            });
        }
    }, [activeTab]);

    const toggleAccordion = (id) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage('');
        try {
            await apiClient.patch('/users/me/', {
                first_name: firstName,
                last_name: lastName,
            });
            await refreshUser();
            setSaveMessage('Changes saved successfully!');
        } catch (err) {
            console.error('Failed to update profile', err);
            setSaveMessage('Failed to save changes.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleDeleteAccount = async () => {
        if (!apiClient) return;
        try {
            await apiClient.delete('/users/me');
            handleLogout(); // Proactively log the user out
        } catch (err) {
            console.error('Failed to delete account:', err);
            setError('Failed to delete account. Please try again or contact support.');
        } finally {
            setDeleteAccountModalOpen(false);
        }
    };

    return (
        <div className="settings-page">
            <ApiKeyGeneratedModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                apiKey={newlyGeneratedKey}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleDeleteKey}
                title="Are you sure?"
                message="This action is irreversible. The API key will be permanently deleted."
                confirmText="Delete"
                variant="danger"
            />
            <ConfirmationModal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setDeleteAccountModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Are you absolutely sure?"
                message="This will permanently delete your account and all associated data. This action cannot be undone."
                confirmText="Yes, delete my account"
                variant="danger"
            />
            <header className="settings-header">
                <h1>Settings</h1>
                <p>Manage your profile and API keys for the selected project.</p>
            </header>

            <div className="settings-box">
                <div className="settings-tabs">
                    <button
                        ref={el => tabsRef.current['profile'] = el}
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                    <button
                        ref={el => tabsRef.current['api-key'] = el}
                        className={`tab-btn ${activeTab === 'api-key' ? 'active' : ''}`}
                        onClick={() => setActiveTab('api-key')}
                    >
                        API Key
                    </button>
                    <div className="tab-indicator" style={indicatorStyle} />
                </div>

                <div className="settings-content">
                    {activeTab === 'api-key' && (
                        <div className="api-key-content">
                            <div className="api-key-header">
                                <div>
                                    <h2>API Keys</h2>
                                    <p>Generate and manage API keys for the currently selected project.</p>
                                </div>
                                <div className="generate-key-wrapper" title={!selectedProject ? "Please select a project first" : ""}>
                                    <button 
                                        className="generate-key-btn" 
                                        onClick={handleGenerateKey}
                                        disabled={!selectedProject}
                                    >
                                        Generate New Key
                                    </button>
                                </div>
                            </div>

                            <div className="api-key-body">
                                <div className="api-key-info">
                                    <div className="accordion-item">
                                        <button className="accordion-header" onClick={() => toggleAccordion('using-key')}>
                                            <h3>Using Your API Key</h3>
                                            {openAccordion === 'using-key' ? <ChevronUp /> : <ChevronDown />}
                                        </button>
                                        {openAccordion === 'using-key' && (
                                            <div className="accordion-content">
                                                <p>Your API key authenticates your requests. Include it in the header:</p>
                                                <code className="code-block">{'X-Api-Key: YOUR_API_KEY'}</code>
                                            </div>
                                        )}
                                    </div>
                                    <div className="accordion-item">
                                        <button className="accordion-header" onClick={() => toggleAccordion('best-practices')}>
                                            <h3>Best Practices</h3>
                                            {openAccordion === 'best-practices' ? <ChevronUp /> : <ChevronDown />}
                                        </button>
                                        {openAccordion === 'best-practices' && (
                                            <div className="accordion-content">
                                                <ul>
                                                    <li>Never share API keys in public repositories</li>
                                                    <li>Rotate keys periodically for security</li>
                                                    <li>Use environment variables to store keys in development</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="api-key-list-container">
                                    <div className="key-list-header">
                                        <h4 className="key-col">API Key</h4>
                                        <h4 className="actions-col">Actions</h4>
                                    </div>
                                    <div className="key-list">
                                        {apiKeys.map(apiKey => (
                                            <div className="key-item" key={apiKey.id}>
                                                <span className="api-key-text">
                                                    {visibleKeys[apiKey.id] ? apiKey.key : `${apiKey.key.substring(0, 8)}...`}
                                                </span>
                                                <div className="key-actions">
                                                    <button className="copy-btn" onClick={() => toggleKeyVisibility(apiKey.id)}>
                                                        {visibleKeys[apiKey.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button className="copy-btn" onClick={() => copyToClipboard(apiKey.key)}>
                                                        <Copy size={16} />
                                                    </button>
                                                    <button className="copy-btn danger" onClick={() => handleDeleteClick(apiKey.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === 'profile' && (
                        <div className="profile-content">
                            <div className="profile-grid">
                                {/* Profile Details Card */}
                                <div className="profile-card">
                                    <h3>Profile Details</h3>
                                    <p>Update your photo and personal details.</p>
                                    <form onSubmit={handleProfileSave}>
                                        <div className="avatar-section">
                                            <img
                                                src={user?.avatar_url || '/default-avatar.svg'}
                                                alt="User Avatar"
                                                className="profile-avatar"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/default-avatar.svg';
                                                }}
                                            />
                                            <button className="avatar-upload-btn">Change</button>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="fullName">Full Name</label>
                                            <input
                                                id="fullName"
                                                type="text"
                                                value={`${firstName} ${lastName}`}
                                                onChange={(e) => {
                                                    const [first, ...last] = e.target.value.split(' ');
                                                    setFirstName(first || '');
                                                    setLastName(last.join(' ') || '');
                                                }}
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                            />
                                        </div>
                                        <div className="form-actions">
                                            {saveMessage && <span className="save-message">{saveMessage}</span>}
                                            <button type="submit" className="save-changes-btn" disabled={isSaving}>
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Appearance Card */}
                                <div className="profile-card">
                                    <h3>Appearance</h3>
                                    <p>Customize the look and feel of the app.</p>
                                    <div className="setting-row">
                                        <span>Theme</span>
                                        <div className="theme-toggle">
                                            <span>Light</span>
                                            <div className="toggle-switch">
                                                <div className="toggle-handle"></div>
                                            </div>
                                            <span>Dark</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone Card */}
                                <div className="profile-card danger-zone">
                                    <h3>Danger Zone</h3>
                                    <p>These actions are permanent and cannot be undone.</p>
                                    <div className="danger-actions">
                                        <button className="danger-btn" onClick={() => setDeleteAccountModalOpen(true)}>Delete Account</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
