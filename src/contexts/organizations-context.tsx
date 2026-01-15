'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    is_system_org?: boolean;
}

interface OrganizationsContextType {
    organizations: Organization[];
    activeOrg: Organization | null;
    isLoading: boolean;
    setActiveOrg: (org: Organization) => void;
    refreshOrganizations: () => Promise<void>;
}

const OrganizationsContext = createContext<OrganizationsContextType | undefined>(undefined);

// Module-level cache that persists across component remounts
let cachedOrganizations: Organization[] | null = null;
let cachedActiveOrg: Organization | null = null;
let fetchPromise: Promise<Organization[]> | null = null;
let hasInitialized = false;

// Helper to get active org from localStorage
function getActiveOrgFromStorage(orgs: Organization[]): Organization | null {
    if (typeof window === 'undefined') return null;
    try {
        const savedOrg = localStorage.getItem('current_org');
        if (savedOrg) {
            const parsed = JSON.parse(savedOrg);
            const found = orgs.find(o => o.id === parsed.id);
            if (found) return found;
        }
    } catch { }
    return orgs.length > 0 ? orgs[0] : null;
}

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>(cachedOrganizations || []);
    const [activeOrg, setActiveOrgState] = useState<Organization | null>(cachedActiveOrg);
    const [isLoading, setIsLoading] = useState(!hasInitialized);
    const initRef = useRef(hasInitialized);

    const fetchOrganizations = useCallback(async (force = false): Promise<Organization[]> => {
        // Return cached data if available and not forcing refresh
        if (!force && cachedOrganizations) {
            return cachedOrganizations;
        }

        // If fetch is already in progress, wait for it
        if (!force && fetchPromise) {
            return fetchPromise;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            return [];
        }

        fetchPromise = (async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const orgs = Array.isArray(data) ? data : (data.organizations || []);
                    cachedOrganizations = orgs;
                    return orgs;
                }
                return [];
            } finally {
                fetchPromise = null;
            }
        })();

        return fetchPromise;
    }, []);

    // Initialize only once across all mounts
    useEffect(() => {
        // Skip if already initialized (cached)
        if (initRef.current) {
            return;
        }

        const init = async () => {
            const orgs = await fetchOrganizations();
            cachedOrganizations = orgs;
            setOrganizations(orgs);

            const active = getActiveOrgFromStorage(orgs);
            if (active) {
                cachedActiveOrg = active;
                setActiveOrgState(active);
                localStorage.setItem('current_org', JSON.stringify(active));
            }

            hasInitialized = true;
            initRef.current = true;
            setIsLoading(false);
        };

        init();
    }, [fetchOrganizations]);

    const setActiveOrg = useCallback((org: Organization) => {
        cachedActiveOrg = org;
        setActiveOrgState(org);
        localStorage.setItem('current_org', JSON.stringify(org));
    }, []);

    const refreshOrganizations = useCallback(async () => {
        setIsLoading(true);
        cachedOrganizations = null;
        hasInitialized = false;
        const orgs = await fetchOrganizations(true);
        cachedOrganizations = orgs;
        setOrganizations(orgs);
        hasInitialized = true;
        setIsLoading(false);
    }, [fetchOrganizations]);

    return (
        <OrganizationsContext.Provider value={{
            organizations,
            activeOrg,
            isLoading,
            setActiveOrg,
            refreshOrganizations
        }}>
            {children}
        </OrganizationsContext.Provider>
    );
}

export function useOrganizations() {
    const context = useContext(OrganizationsContext);
    if (context === undefined) {
        throw new Error('useOrganizations must be used within an OrganizationsProvider');
    }
    return context;
}

