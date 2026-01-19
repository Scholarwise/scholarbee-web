"use client"

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'
import { useEffect, useState } from 'react'

export default function ApiDocsPage() {
    const [isDarkMode, setIsDarkMode] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        // Check initial theme
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark')
            setIsDarkMode(isDark)
        }
        checkDarkMode()

        // Watch for theme changes
        const observer = new MutationObserver(checkDarkMode)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })

        return () => observer.disconnect()
    }, [])

    // Don't render until theme is detected
    if (isDarkMode === undefined) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        )
    }

    return (
        <div className="h-screen -mx-4 -mb-4 overflow-hidden">
            <div className="h-full overflow-auto">
                <ApiReferenceReact
                    key={isDarkMode ? 'dark' : 'light'}
                    configuration={{
                        url: '/openapi.yaml',
                        theme: 'elysiajs',
                        hideModels: false,
                        hideDownloadButton: false,
                        forceDarkModeState: isDarkMode ? 'dark' : 'light',
                        layout: 'modern',
                        hideDarkModeToggle: true,
                        expandAllResponses: true,
                        defaultOpenAllTags: true,
                    }}
                />
            </div>
        </div>
    )
}
