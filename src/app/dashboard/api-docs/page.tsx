'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
    return (
        <div
            style={{
                height: 'calc(100vh - 64px)',
                width: '100%',
                position: 'relative',
            }}
        >
            <ApiReferenceReact
                configuration={{
                    url: '/openapi.yaml',
                    theme: 'purple',
                    darkMode: true,
                    layout: 'modern',
                    defaultOpenAllTags: true,
                }}
            />
        </div>
    );
}
