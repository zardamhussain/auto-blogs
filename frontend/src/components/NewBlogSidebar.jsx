import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { useTasks } from '../context/TaskContext';
import './NewBlogSidebar.css';

const NewBlogSidebar = ({ isOpen, onClose, onGenerationComplete, supportedLanguages }) => {
    const { selectedProject, apiClient } = useProjects();
    const { addToast } = useToast();
    const { addTask } = useTasks();
    const [topic, setTopic] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // New state management based on the design sketch
    const [numImages, setNumImages] = useState(1);
    const [includeGoogle, setIncludeGoogle] = useState(true);
    const [includeReddit, setIncludeReddit] = useState(false);
    const [targetLanguages, setTargetLanguages] = useState([]);

    useEffect(() => {
        const fetchPrompts = async () => {
            if (!isOpen || !selectedProject || !apiClient) return;
            try {
                const response = await apiClient.get(`/prompts/project/${selectedProject}`);
                setPrompts(response.data.filter(p => p.is_active));
            } catch (error) {
                console.error('Failed to fetch prompts:', error);
                addToast('Failed to fetch prompts.', 'error');
            }
        };
        fetchPrompts();
    }, [isOpen, selectedProject, apiClient, addToast]);

    const resetForm = () => {
        setTopic('');
        setSelectedPrompt('');
        setIsGenerating(false);
        setNumImages(1);
        setIncludeGoogle(true);
        setIncludeReddit(false);
        setTargetLanguages([]);
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic) return;

        setIsGenerating(true);
        addToast('Blog post generation started...', 'info');

        try {
            const payload = {
                project_id: selectedProject,
                topic: topic,
                writing_style_prompt_id: selectedPrompt || null,
                include_google: includeGoogle,
                include_reddit: includeReddit,
                include_images: numImages > 0,
                num_images: numImages,
                include_translation: targetLanguages.length > 0,
                target_languages: targetLanguages,
            };

            const response = await apiClient.post('/generate/blog-post', payload);
            
            console.log("Full API Response:", response);
            if (response.data) {
                console.log("API Response Data:", response.data);
            }

            if (response.status !== 200) {
                throw new Error(response.data.detail || 'Failed to start blog post generation.');
            }

            addTask(response.data.run_id, onGenerationComplete);
            resetForm();
            onClose(); 

        } catch (error) {
            console.error('Error creating blog:', error);
            addToast(error.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleLanguageSelect = (e) => {
        const langCode = e.target.value;
        if (langCode && !targetLanguages.includes(langCode)) {
            setTargetLanguages([...targetLanguages, langCode]);
        }
    };

    const removeLanguage = (langCode) => {
        setTargetLanguages(targetLanguages.filter(l => l !== langCode));
    };


  if (!isOpen) return null;

    return (
        <div className="new-blog-sidebar-overlay" onClick={onClose}>
            <div className="new-blog-sidebar-content" onClick={(e) => e.stopPropagation()}>
                <div className="sidebar-header">
                    <h2>Generate Blog</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="sidebar-form">
                    <div className="form-group">
                        <textarea
                            id="blog-query"
                            rows="5"
                            placeholder="Query text area"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    
                    <div style={{fontSize: '1.25rem', fontWeight: '500', color: '#eaeaea', marginBottom: '1.5rem'}}>
                        Settings
                    </div>

                    <div className="settings-section">
                        <label>Images</label>
                        <select value={numImages} onChange={e => setNumImages(parseInt(e.target.value))}>
                            {[...Array(6).keys()].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>

                    <div className="settings-section">
                        <label>Knowledge Sources</label>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" checked={includeReddit} onChange={(e) => setIncludeReddit(e.target.checked)} />
                                Reddit
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" checked={includeGoogle} onChange={(e) => setIncludeGoogle(e.target.checked)} />
                                Google
                            </label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <label htmlFor="writing-style">Writing Style</label>
                        <select id="writing-style" value={selectedPrompt} onChange={(e) => setSelectedPrompt(e.target.value)}>
                            <option value="">Choose blog guide</option>
                            {prompts.map(prompt => (
                                <option key={prompt.id} value={prompt.id}>{prompt.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="settings-section">
                        <label htmlFor="language-select">Translations</label>
                        <select 
                            id="language-select" 
                            onChange={handleLanguageSelect} 
                            value=""
                            disabled={!supportedLanguages || supportedLanguages.length === 0}
                        >
                            <option value="">
                                {!supportedLanguages || supportedLanguages.length === 0 
                                    ? 'Loading languages...' 
                                    : 'Select Language ↓'}
                            </option>
                            {supportedLanguages?.filter(l => l.language_code !== 'en' && !targetLanguages.includes(l.language_code)).map(lang => (
                                <option key={lang.language_code} value={lang.language_code}>{lang.language_name}</option>
                            ))}
                        </select>
                        <div className="language-tags-display">
                            {targetLanguages.map(langCode => {
                                const lang = supportedLanguages.find(l => l.language_code === langCode);
                                return (
                                    <span key={langCode} className="language-tag">
                                        {lang ? lang.language_name : langCode}
                                        <button onClick={() => removeLanguage(langCode)} className="remove-tag-btn">&times;</button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="generate-btn" disabled={!topic || isGenerating}>
                            {isGenerating ? 'Starting...' : 'Generate Blog'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewBlogSidebar;
