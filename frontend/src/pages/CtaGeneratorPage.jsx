import React, { useState, useEffect, useRef } from 'react';
import './CtaGeneratorPage.css';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { TbFileCode, TbEye, TbX } from 'react-icons/tb'; // Import icons for toggle
import CtaCard from '../components/CtaCard';
import Toast from '../components/Toast';
import NewCtaModal from '../components/NewCtaModal';
import Loader from '../components/ui/Loader'; // Import the new Loader component

function CtaGeneratorPage() {
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'js'
    const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'
    const [ctas, setCtas] = useState([]); // State to store list of chats
    const [selectedChatId, setSelectedChatId] = useState(null); // State for selected chat
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isLoadingCtaResponse, setIsLoadingCtaResponse] = useState(false); // New state for chat response loading
    const [isNewCtaModalOpen, setIsNewCtaModalOpen] = useState(false);
    const [isNewCtaGenerating, setIsNewCtaGenerating] = useState(false); // State to track if NewCtaModal is generating
    const [toast, setToast] = useState({ message: '', type: '' });
    const [rightPanelWidth, setRightPanelWidth] = useState(350);
    const isResizing = useRef(false);
    const dragInfo = useRef({ initialX: 0, initialWidth: 0 });
    
    const { apiClient, currentUserRole } = useProjects();
    const { user } = useAuth();

    const handleMouseDown = (e) => {
        e.preventDefault();
        isResizing.current = true;
        dragInfo.current = {
            initialX: e.clientX,
            initialWidth: rightPanelWidth,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const dx = e.clientX - dragInfo.current.initialX;
            const newWidth = dragInfo.current.initialWidth - dx;
            if (newWidth >= 250 && newWidth <= 600) { // Constraints for resizing
                setRightPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const handleNewCtaGenerationSuccess = (newChatId) => {
        // After a new CTA is generated, refetch chats and select the new one
        fetchChats(); // Re-fetch the list of CTAs to include the new one
        setSelectedChatId(newChatId); // Select the newly created chat
        setChatHistory([]); // Clear history for the new chat
        setGeneratedHtml('');
        setIsNewCtaGenerating(false); // Reset this state
    };

    // Fetch all chats for the user
    const fetchChats = async () => {
        if (!apiClient || !user) return;
        setLoadingChats(true);
        try {
            const response = await apiClient.get(`/cta/chats?user_id=${user.id}`);
            setCtas(response.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
            setCtas([]);
        } finally {
            setLoadingChats(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, [apiClient, user]);

    // Fetch messages for a selected chat
    const fetchMessagesForChat = async (chatId) => {
        if (!apiClient || !user || !chatId) return;
        setLoadingMessages(true);
        try {
            const response = await apiClient.get(`/cta/chats/${chatId}/messages?user_id=${user.id}`);
            const messages = response.data;
            setChatHistory(messages);

            // Find the latest AI message with content for the preview
            const latestAIMessage = messages.slice().reverse().find(msg => msg.sender === 'assistant' && msg.json_content?.full_html);
            if (latestAIMessage) {
                setGeneratedHtml(latestAIMessage.json_content.full_html);
            } else {
                setGeneratedHtml('');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setChatHistory([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (selectedChatId) {
            fetchMessagesForChat(selectedChatId);
        }
    }, [selectedChatId, apiClient, user]);

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !user || !apiClient) return;

        const userMessage = { sender: 'user', content: chatInput };
        setChatHistory((prev) => [...prev, userMessage]);
        setChatInput('');
        setIsLoadingCtaResponse(true); // Start loading

        try {
            const response = await apiClient.post('/cta/chat', {
                user_id: user.id,
                content: chatInput,
                chat_id: selectedChatId, // Use selectedChatId for continuing conversation
            });

            const aiMessage = { 
                sender: 'assistant', 
                content: response.data.content,
                chat_id: response.data.chat_id,
                json_content: response.data.json_content // Include json_content
            };
            setChatHistory((prev) => [...prev, aiMessage]);

            setGeneratedHtml(response.data.json_content?.full_html || '');
            setSelectedChatId(response.data.chat_id); // Ensure chat_id is set for new chats

        } catch (error) {
            console.error('Error sending message:', error);
            setChatHistory((prev) => [...prev, { sender: 'assistant', content: 'Error: Could not get a response.' }]);
        } finally {
            setIsLoadingCtaResponse(false); // End loading
        }
    };

    const getCodeToDisplay = () => {
        switch (activeTab) {
            case 'html':
                return generatedHtml;
            default:
                return '';
        }
    };

    return (
        <div className="cta-generator-page">
            {!selectedChatId ? (
                <div className="cta-list-container">
                    <div className="page-actions">
                        <h1 className="main-heading">Your CTAs</h1>
                        <div className="new-cta-btn-container">
                            {currentUserRole !== 'viewer' && <button 
                                className="new-cta-btn"
                                onClick={() => setIsNewCtaModalOpen(true)} // Open the modal
                            >
                                + New CTA
                            </button>}
                        </div>
                    </div>
                    <div className="cta-list">
                        {loadingChats ? (
                            <p>Loading CTAs...</p>
                        ) : ctas.length > 0 ? (
                            ctas.map(cta => (
                                <CtaCard
                                    key={cta.id}
                                    title={cta.first_message_content || `Chat ID: ${cta.id}`}
                                    status={"Generated"} // Placeholder status
                                    createdAt={cta.created_at}
                                    onClick={() => setSelectedChatId(cta.id)}
                                    // onDelete={() => handleDeleteCta(cta.id)} // Implement delete functionality if needed
                                />
                            ))
                        ) : (
                            <p>No CTAs generated yet. Start a new one!</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="cta-editor-wrapper">
                    <div className="cta-page-header-custom">
                        <nav className="breadcrumb">
                            <span className="breadcrumb-item">Workspace</span>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-item active">CTA</span>
                        </nav>
                        <div className="header-controls-right">
                            <div className="view-toggle">
                                <button
                                    className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
                                    onClick={() => setViewMode('preview')}
                                >
                                    <TbEye /> Preview
                                </button>
                                <button
                                    className={`toggle-btn ${viewMode === 'code' ? 'active' : ''}`}
                                    onClick={() => setViewMode('code')}
                                >
                                    <TbFileCode /> Code
                                </button>
                            </div>
                            <button className="close-editor-btn" onClick={() => setSelectedChatId(null)}>
                                <TbX size={24} />
                            </button>
                        </div>
                    </div>
                    {viewMode === 'preview' ? (
                        <div className="main-content-box-preview">
                            <div className="generated-cta-preview-child">
                                <h2>Generated CTA Preview</h2>
                                <div className="cta-preview-frame">
                                    <iframe
                                        srcDoc={generatedHtml}
                                        sandbox="allow-scripts allow-same-origin"
                                        frameBorder="0"
                                        title="CTA Preview"
                                    ></iframe>
                                </div>
                            </div>
                            <div className="resizer" onMouseDown={handleMouseDown} />
                            <div className="chat-section-child" style={{ width: `${rightPanelWidth}px` }}>
                                <h2>Instruction Section</h2>
                                <div className="chat-history">
                                    {loadingMessages ? (
                                        <p>Loading messages...</p>
                                    ) : (
                                        chatHistory.filter(msg => msg.sender === 'user' && msg.content).map((msg, index) => {
                                            const cleanedContent = msg.content.replace(/dubit/gi, '').trim();
                                            if (!cleanedContent) return null; // Don't render if content is empty after cleaning
                                            return (
                                                <div
                                                    key={index}
                                                    className={`chat-message ${msg.sender}`}
                                                    style={{ color: 'rgba(128, 90, 213, 0.85)' }} // faded purple
                                                >
                                                    {cleanedContent}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <form onSubmit={handleChatSubmit} className="chat-input-form">
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type your instruction..."
                                    ></textarea>
                                    <button type="submit" disabled={!chatInput.trim() || isLoadingCtaResponse}>
                                        {isLoadingCtaResponse ? 'Generating...' : 'Send'}
                                    </button>
                                </form>
                            </div>
                            {isLoadingCtaResponse && <Loader />} {/* Render loader when generating response */}
                        </div>
                    ) : (
                        <div className="main-content-box-code-full-width">
                            <h2>Generated Code</h2>
                            <div className="code-display-panels">
                                <div className="code-file-navigation">
                                    <div className="file-tree-item">
                                        <span className="file-icon">📁</span>
                                        <span className="folder-name">src</span>
                                        <div className="file-tree-children">
                                            <div className="file-tree-item file-item">
                                                <button 
                                                    className={`file-name-btn ${activeTab === 'html' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('html')}
                                                ><span className="file-icon">📄</span>index.html</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="code-content-display">
                                    <pre className="code-block">
                                        <code>{getCodeToDisplay()}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: '', type: '' })}
            />
            <NewCtaModal
                isOpen={isNewCtaModalOpen}
                onClose={() => setIsNewCtaModalOpen(false)}
                onGenerationSuccess={handleNewCtaGenerationSuccess}
                showToast={showToast}
                isGenerating={isNewCtaGenerating}
                setIsGenerating={setIsNewCtaGenerating}
            />
            {isNewCtaGenerating && <Loader />} {/* Render loader when creating new CTA */}
        </div>
    );
}

export default CtaGeneratorPage; 