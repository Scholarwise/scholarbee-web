'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <ApiReferenceReact
                configuration={{
                    url: 'https://raw.githubusercontent.com/Scholarwise/scholarbee-monorepo/main/api/openapi.yaml',
                    theme: 'purple',
                    darkMode: true,
                    hideModels: false,
                    showSidebar: true,
                    layout: 'modern',
                }}
            />
        </div>
    );
}
