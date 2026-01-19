'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
    return (
        <div className="h-full w-full">
            <ApiReferenceReact
                configuration={{
                    url: '/openapi.yaml',
                    theme: 'purple',
                    darkMode: true,
                    layout: 'classic',
                }}
            />
        </div>
    );
}
