import React, { useState } from 'react';
import './FileExplorer.css';

const FileExplorer = () => {
    const [selectedFileContent, setSelectedFileContent] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');

    // Dummy data for file tree - in a real application, this would come from an API
    const fileTree = [
        {
            name: 'src',
            type: 'folder',
            children: [
                {
                    name: 'components',
                    type: 'folder',
                    children: [
                        { name: 'Button.jsx', type: 'file', content: '// Button component code\nconst Button = () => {};' },
                        { name: 'Input.jsx', type: 'file', content: '// Input component code\nconst Input = () => {};' },
                    ],
                },
                {
                    name: 'pages',
                    type: 'folder',
                    children: [
                        { name: 'HomePage.jsx', type: 'file', content: '// Home page component code\nconst HomePage = () => {};' },
                        { name: 'AboutPage.jsx', type: 'file', content: '// About page component code\nconst AboutPage = () => {};' },
                    ],
                },
                { name: 'App.jsx', type: 'file', content: '// Main App component' },
                { name: 'index.js', type: 'file', content: '// Entry point of the application' },
            ],
        },
        { name: 'package.json', type: 'file', content: '{\n  "name": "my-app",\n  "version": "1.0.0"\n}' },
        { name: 'README.md', type: 'file', content: '# My Application\n\nThis is a simple application.' },
    ];

    const handleFileClick = (file) => {
        if (file.type === 'file') {
            setSelectedFileContent(file.content);
            setSelectedFileName(file.name);
        }
    };

    const renderTree = (nodes) => (
        <ul>
            {nodes.map((node, index) => (
                <li key={index}>
                    <div
                        className={`tree-item ${node.type === 'file' ? 'file-item' : 'folder-item'}`}
                        onClick={() => handleFileClick(node)}
                    >
                        <span className="file-icon">{node.type === 'folder' ? '📁' : '📄'}</span>
                        {node.name}
                    </div>
                    {node.type === 'folder' && node.children && (
                        <div className="folder-children">
                            {renderTree(node.children)}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <div className="file-explorer-container">
            {/* Left Panel: File Tree */}
            <div className="file-tree-panel">
                <h3>File Explorer</h3>
                <div className="file-tree">
                    {renderTree(fileTree)}
                </div>
            </div>

            {/* Right Panel: File Content */}
            <div className="file-content-panel">
                {selectedFileContent ? (
                    <>
                        <h3>{selectedFileName}</h3>
                        <pre className="file-content-display">
                            <code>{selectedFileContent}</code>
                        </pre>
                    </>
                ) : (
                    <p className="no-file-selected">Select a file to view its content.</p>
                )}
            </div>
        </div>
    );
};

export default FileExplorer; 